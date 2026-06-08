import { Hono } from "hono";
import prisma from "../lib/prisma";
import { generateInvoicePdf } from "../lib/pdf";
import { getProductStockMap } from "../lib/stock";
import { authMiddleware } from "../middleware/auth";

const saleRoutes = new Hono();

saleRoutes.use("*", authMiddleware);

const SALE_SELECT = {
	id: true,
	clientId: true,
	customer: true,
	status: true,
	notes: true,
	paymentMethod: true,
	paidAt: true,
	paymentNotes: true,
	reversalReason: true,
	reversedBy: true,
	reversedAt: true,
	deliveredAt: true,
	deliveryDate: true,
	completedAt: true,
	createdAt: true,
	updatedAt: true,
	client: {
		select: { id: true, name: true, phone: true, status: true },
	},
	items: {
		select: {
			id: true,
			productId: true,
			quantity: true,
			unitPrice: true,
			product: {
				select: { id: true, name: true, unit: true, status: true },
			},
		},
	},
};

type SaleItemInput = {
	productId: string;
	quantity: number;
	unitPrice: number;
};

function validateSaleItems(items: SaleItemInput[]) {
	if (!Array.isArray(items) || items.length === 0) {
		return "Pelo menos um item é obrigatório.";
	}

	const productIds = new Set<string>();
	for (const item of items) {
		if (!item.productId || !item.quantity || item.quantity <= 0) {
			return "Cada item deve ter produto e quantidade (> 0).";
		}
		if (item.unitPrice < 0) {
			return "O preço unitário não pode ser negativo.";
		}
		if (productIds.has(item.productId)) {
			return "Não é permitido repetir o mesmo produto na venda.";
		}
		productIds.add(item.productId);
	}

	return null;
}

async function ensureProductsAvailable(
	items: { productId: string; quantity: number; product: { name: string } }[],
) {
	const stockByProduct = await getProductStockMap(
		items.map((item) => item.productId),
	);

	for (const item of items) {
		const available = stockByProduct.get(item.productId) ?? 0;
		if (available < item.quantity) {
			return `Estoque insuficiente para ${item.product.name}. Disponível: ${available}.`;
		}
	}

	return null;
}

saleRoutes.get("/", async (c) => {
	const status = c.req.query("status");
	const where = status ? { status } : {};

	const sales = await prisma.sale.findMany({
		where,
		select: SALE_SELECT,
		orderBy: { createdAt: "desc" },
	});

	return c.json({ sales });
});

saleRoutes.post("/", async (c) => {
	const body = await c.req.json();
	const { clientId, notes, deliveryDate, items } = body as {
		clientId: string;
		notes?: string;
		deliveryDate: string;
		items: SaleItemInput[];
	};

	if (!clientId) {
		return c.json({ error: "Cliente é obrigatório." }, 400);
	}

	if (
		!deliveryDate ||
		Number.isNaN(new Date(`${deliveryDate}T00:00:00`).getTime())
	) {
		return c.json({ error: "Data de entrega é obrigatória." }, 400);
	}

	const client = await prisma.client.findUnique({ where: { id: clientId } });
	if (!client || client.status !== "active") {
		return c.json({ error: "Cliente não encontrado ou inativo." }, 404);
	}

	const validationError = validateSaleItems(items);
	if (validationError) {
		return c.json({ error: validationError }, 400);
	}

	const productIds = items.map((item) => item.productId);
	const products = await prisma.product.findMany({
		where: { id: { in: productIds }, status: "active" },
	});
	if (products.length !== productIds.length) {
		return c.json(
			{ error: "Um ou mais produtos não encontrados ou inativos." },
			404,
		);
	}

	const sale = await prisma.sale.create({
		data: {
			clientId,
			customer: client.name,
			notes: notes || "",
			deliveryDate: new Date(`${deliveryDate}T00:00:00`),
			status: "in_preparation",
			items: {
				createMany: {
					data: items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: item.unitPrice || 0,
					})),
				},
			},
		},
		select: SALE_SELECT,
	});

	return c.json({ sale }, 201);
});

saleRoutes.get("/:id", async (c) => {
	const saleId = c.req.param("id");
	const sale = await prisma.sale.findUnique({
		where: { id: saleId },
		select: SALE_SELECT,
	});

	if (!sale) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}

	return c.json({ sale });
});

saleRoutes.patch("/:id", async (c) => {
	const saleId = c.req.param("id");
	const body = await c.req.json();
	const { clientId, notes, deliveryDate, items } = body as {
		clientId?: string;
		notes?: string;
		deliveryDate?: string;
		items?: SaleItemInput[];
	};

	const existing = await prisma.sale.findUnique({ where: { id: saleId } });
	if (!existing) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}

	if (existing.status === "completed") {
		return c.json({ error: "Vendas concluídas não podem ser editadas." }, 400);
	}

	const client = clientId
		? await prisma.client.findUnique({ where: { id: clientId } })
		: null;
	if (clientId && (!client || client.status !== "active")) {
		return c.json({ error: "Cliente não encontrado ou inativo." }, 404);
	}

	if (items) {
		const validationError = validateSaleItems(items);
		if (validationError) {
			return c.json({ error: validationError }, 400);
		}

		const productIds = items.map((item) => item.productId);
		const products = await prisma.product.findMany({
			where: { id: { in: productIds }, status: "active" },
		});
		if (products.length !== productIds.length) {
			return c.json(
				{ error: "Um ou mais produtos não encontrados ou inativos." },
				404,
			);
		}
	}

	if (
		deliveryDate !== undefined &&
		Number.isNaN(new Date(`${deliveryDate}T00:00:00`).getTime())
	) {
		return c.json({ error: "Data de entrega inválida." }, 400);
	}

	await prisma.$transaction(async (tx) => {
		const data: {
			clientId?: string;
			customer?: string;
			notes?: string;
			deliveryDate?: Date;
		} = {};
		if (client) {
			data.clientId = client.id;
			data.customer = client.name;
		}
		if (notes !== undefined) data.notes = notes;
		if (deliveryDate !== undefined)
			data.deliveryDate = new Date(`${deliveryDate}T00:00:00`);

		await tx.sale.update({ where: { id: saleId }, data });

		if (items && items.length > 0) {
			await tx.saleItem.deleteMany({ where: { saleId } });
			await tx.saleItem.createMany({
				data: items.map((item) => ({
					saleId,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice || 0,
				})),
			});
		}
	});

	const sale = await prisma.sale.findUnique({
		where: { id: saleId },
		select: SALE_SELECT,
	});

	return c.json({ sale });
});

saleRoutes.post("/:id/ready-for-delivery", async (c) => {
	const saleId = c.req.param("id");
	const existing = await prisma.sale.findUnique({ where: { id: saleId } });

	if (!existing) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}
	if (existing.status !== "in_preparation") {
		return c.json(
			{
				error:
					"Apenas vendas em preparo podem ser marcadas como prontas para entrega.",
			},
			400,
		);
	}

	const sale = await prisma.sale.update({
		where: { id: saleId },
		data: { status: "ready_for_delivery" },
		select: SALE_SELECT,
	});

	return c.json({ sale });
});

saleRoutes.post("/:id/deliver", async (c) => {
	const saleId = c.req.param("id");
	const userId = c.get("userId") as string;

	const existing = await prisma.sale.findUnique({
		where: { id: saleId },
		include: { items: { include: { product: true } } },
	});

	if (!existing) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}
	if (existing.status !== "ready_for_delivery") {
		return c.json(
			{ error: "Apenas vendas prontas para entrega podem ser entregues." },
			400,
		);
	}

	const stockError = await ensureProductsAvailable(existing.items);
	if (stockError) {
		return c.json({ error: stockError }, 400);
	}

	await prisma.$transaction(async (tx) => {
		await tx.sale.update({
			where: { id: saleId },
			data: { status: "delivered", deliveredAt: new Date() },
		});

		const stockByProduct = await getProductStockMap(
			existing.items.map((item) => item.productId),
			tx,
		);

		for (const item of existing.items) {
			const quantity = -item.quantity;
			const stockBefore = stockByProduct.get(item.productId) ?? 0;

			await tx.stockMovement.create({
				data: {
					productId: item.productId,
					authorId: userId,
					quantity,
					stockBefore,
					stockAfter: stockBefore + quantity,
					type: "sale_delivery",
					referenceId: saleId,
					notes: `Venda para ${existing.customer} — entrega de ${item.quantity} ${item.product.unit} de ${item.product.name}`,
				},
			});
		}
	});

	const sale = await prisma.sale.findUnique({
		where: { id: saleId },
		select: SALE_SELECT,
	});

	return c.json({ sale });
});

saleRoutes.post("/:id/complete", async (c) => {
	const saleId = c.req.param("id");
	const body = await c.req.json();
	const { paymentMethod, paidAt, paymentNotes } = body as {
		paymentMethod: string;
		paidAt: string;
		paymentNotes?: string;
	};

	if (!paymentMethod || !paymentMethod.trim()) {
		return c.json({ error: "Forma de pagamento é obrigatória." }, 400);
	}
	if (!paidAt || Number.isNaN(new Date(paidAt).getTime())) {
		return c.json({ error: "Data do pagamento é obrigatória." }, 400);
	}

	const existing = await prisma.sale.findUnique({ where: { id: saleId } });
	if (!existing) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}
	if (existing.status !== "delivered") {
		return c.json(
			{ error: "Apenas vendas entregues podem ser concluídas." },
			400,
		);
	}

	const sale = await prisma.sale.update({
		where: { id: saleId },
		data: {
			status: "completed",
			completedAt: new Date(),
			paymentMethod: paymentMethod.trim(),
			paidAt: new Date(paidAt),
			paymentNotes: paymentNotes?.trim() || "",
		},
		select: SALE_SELECT,
	});

	return c.json({ sale });
});

saleRoutes.post("/:id/reverse", async (c) => {
	const saleId = c.req.param("id");
	const userId = c.get("userId") as string;
	const body = await c.req.json();
	const { reason } = body as { reason: string };

	if (!reason || !reason.trim()) {
		return c.json({ error: "Motivo do estorno é obrigatório." }, 400);
	}

	const existing = await prisma.sale.findUnique({
		where: { id: saleId },
		include: { items: { include: { product: true } } },
	});

	if (!existing) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}
	if (existing.status !== "completed") {
		return c.json(
			{ error: "Apenas vendas concluídas podem ser estornadas." },
			400,
		);
	}

	await prisma.$transaction(async (tx) => {
		await tx.sale.update({
			where: { id: saleId },
			data: {
				status: "in_preparation",
				deliveredAt: null,
				completedAt: null,
				paymentMethod: "",
				paidAt: null,
				paymentNotes: "",
				reversalReason: reason.trim(),
				reversedBy: userId,
				reversedAt: new Date(),
			},
		});

		const stockByProduct = await getProductStockMap(
			existing.items.map((item) => item.productId),
			tx,
		);

		for (const item of existing.items) {
			const stockBefore = stockByProduct.get(item.productId) ?? 0;

			await tx.stockMovement.create({
				data: {
					productId: item.productId,
					authorId: userId,
					quantity: item.quantity,
					stockBefore,
					stockAfter: stockBefore + item.quantity,
					type: "sale_reversal",
					referenceId: saleId,
					notes: `Estorno da venda para ${existing.customer} — devolução de ${item.quantity} ${item.product.unit} de ${item.product.name} | Motivo: ${reason.trim()}`,
				},
			});
		}
	});

	const sale = await prisma.sale.findUnique({
		where: { id: saleId },
		select: SALE_SELECT,
	});

	return c.json({ sale });
});

saleRoutes.get("/:id/invoice", async (c) => {
	const saleId = c.req.param("id");

	const sale = await prisma.sale.findUnique({
		where: { id: saleId },
		select: {
			...SALE_SELECT,
			paymentMethod: true,
			paidAt: true,
			paymentNotes: true,
			deliveryDate: true,
			notes: true,
		},
	});

	if (!sale) {
		return c.json({ error: "Venda não encontrada." }, 404);
	}

	const company = await prisma.company.findUnique({
		where: { singletonKey: "default" },
	});

	if (!company) {
		return c.json({ error: "Dados da empresa não configurados." }, 400);
	}

	const client = await prisma.client.findUnique({
		where: { id: sale.clientId },
		select: {
			name: true,
			phone: true,
			street: true,
			number: true,
			complement: true,
			neighborhood: true,
			city: true,
			state: true,
		},
	});

	const pdfBuffer = await generateInvoicePdf({
		saleId: sale.id,
		status: sale.status,
		createdAt: sale.createdAt.toISOString(),
		deliveryDate: sale.deliveryDate?.toISOString() ?? null,
		paymentMethod: sale.paymentMethod,
		paidAt: sale.paidAt?.toISOString() ?? null,
		paymentNotes: sale.paymentNotes,
		notes: sale.notes,
		items: sale.items.map((item) => ({
			name: item.product.name,
			unit: item.product.unit,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
		})),
		company: {
			name: company.name,
			tradeName: company.tradeName,
			cnpj: company.cnpj,
			email: company.email,
			phone: company.phone,
			logoUrl: company.logoUrl,
			street: company.street,
			number: company.number,
			complement: company.complement,
			neighborhood: company.neighborhood,
			city: company.city,
			state: company.state,
			website: company.website,
			whatsapp: company.whatsapp,
		},
		client: client || {
			name: sale.customer,
			phone: "",
			street: "",
			number: "",
			complement: "",
			neighborhood: "",
			city: "",
			state: "",
		},
	});

	const shortId = sale.id.slice(-8).toUpperCase();
	c.header("Content-Type", "application/pdf");
	c.header(
		"Content-Disposition",
		`attachment; filename="fatura-${shortId}.pdf"`,
	);

	return c.body(pdfBuffer);
});

export { saleRoutes };
