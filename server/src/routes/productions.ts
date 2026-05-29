import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const productionRoutes = new Hono()

productionRoutes.use('*', authMiddleware)

const PRODUCTION_SELECT = {
  id: true,
  productId: true,
  quantity: true,
  status: true,
  notes: true,
  reversalReason: true,
  reversedBy: true,
  reversedAt: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  product: {
    select: { id: true, name: true, unit: true },
  },
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
    },
  },
}

type ProductionItemInput = {
  productId: string
  quantity: number
}

function normalizeProductionItems(body: {
  productId?: string
  quantity?: number
  items?: ProductionItemInput[]
}) {
  const items = Array.isArray(body.items)
    ? body.items
    : body.productId
      ? [{ productId: body.productId, quantity: Number(body.quantity) }]
      : []

  return items.map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity),
  }))
}

function validateProductionItems(items: ProductionItemInput[]) {
  if (items.length === 0) {
    return 'Pelo menos um item é obrigatório.'
  }

  const productIds = new Set<string>()
  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return 'Cada item deve ter produto e quantidade (> 0).'
    }
    if (productIds.has(item.productId)) {
      return 'Não é permitido repetir o mesmo produto na produção.'
    }
    productIds.add(item.productId)
  }

  return null
}

productionRoutes.get('/', async (c) => {
  const status = c.req.query('status')

  const where = status ? { status } : {}

  const productions = await prisma.production.findMany({
    where,
    select: PRODUCTION_SELECT,
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ productions })
})

productionRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { notes } = body as { notes?: string }
  const items = normalizeProductionItems(body)
  const validationError = validateProductionItems(items)

  if (validationError) {
    return c.json({ error: validationError }, 400)
  }

  const productIds = items.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'active' },
  })

  if (products.length !== productIds.length) {
    return c.json({ error: 'Um ou mais produtos não encontrados ou inativos.' }, 404)
  }

  const firstItem = items[0]
  const production = await prisma.production.create({
    data: {
      productId: firstItem.productId,
      quantity: firstItem.quantity,
      notes: notes || '',
      status: 'draft',
      items: {
        createMany: { data: items },
      },
    },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production }, 201)
})

productionRoutes.get('/:id', async (c) => {
  const productionId = c.req.param('id')

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    select: {
      ...PRODUCTION_SELECT,
      product: {
        select: {
          id: true,
          name: true,
          unit: true,
          composition: {
            select: {
              id: true,
              supplyId: true,
              quantity: true,
              supply: {
                select: { id: true, name: true, unit: true },
              },
            },
          },
        },
      },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              composition: {
                select: {
                  id: true,
                  supplyId: true,
                  quantity: true,
                  supply: {
                    select: { id: true, name: true, unit: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!production) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  const productionItems =
    production.items.length > 0
      ? production.items
      : [
          {
            id: production.id,
            productId: production.productId,
            quantity: production.quantity,
            product: production.product,
          },
        ]

  const compositionMap = new Map<
    string,
    { supplyId: string; supplyName: string; unit: string; needed: number }
  >()

  for (const item of productionItems) {
    for (const comp of item.product.composition) {
      const current = compositionMap.get(comp.supplyId)
      const needed = comp.quantity * item.quantity

      if (current) {
        current.needed += needed
      } else {
        compositionMap.set(comp.supplyId, {
          supplyId: comp.supplyId,
          supplyName: comp.supply.name,
          unit: comp.supply.unit,
          needed,
        })
      }
    }
  }

  const compositionNeeded = Array.from(compositionMap.values())
  const suppliesStockCheck = await Promise.all(
    compositionNeeded.map(async (item) => {
      const result = await prisma.stockMovement.aggregate({
        where: { supplyId: item.supplyId },
        _sum: { quantity: true },
      })
      return {
        ...item,
        available: result._sum.quantity || 0,
        sufficient: (result._sum.quantity || 0) >= item.needed,
      }
    })
  )

  return c.json({ production, compositionNeeded: suppliesStockCheck })
})

productionRoutes.patch('/:id', async (c) => {
  const productionId = c.req.param('id')
  const body = await c.req.json()
  const { notes } = body as { notes?: string }
  const items = normalizeProductionItems(body)

  const existing = await prisma.production.findUnique({ where: { id: productionId } })
  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'draft') {
    return c.json({ error: 'Apenas produções em rascunho podem ser editadas.' }, 400)
  }

  const validationError = items.length > 0 ? validateProductionItems(items) : null
  if (validationError) {
    return c.json({ error: validationError }, 400)
  }

  if (items.length > 0) {
    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'active' },
    })

    if (products.length !== productIds.length) {
      return c.json({ error: 'Um ou mais produtos não encontrados ou inativos.' }, 404)
    }
  }

  await prisma.$transaction(async (tx) => {
    const data: { productId?: string; quantity?: number; notes?: string } = {}
    if (notes !== undefined) data.notes = notes

    if (items.length > 0) {
      const firstItem = items[0]
      data.productId = firstItem.productId
      data.quantity = firstItem.quantity
    }

    await tx.production.update({
      where: { id: productionId },
      data,
    })

    if (items.length > 0) {
      await tx.productionItem.deleteMany({ where: { productionId } })
      await tx.productionItem.createMany({
        data: items.map((item) => ({ ...item, productionId })),
      })
    }
  })

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

productionRoutes.post('/:id/start', async (c) => {
  const productionId = c.req.param('id')

  const existing = await prisma.production.findUnique({
    where: { id: productionId },
  })
  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'draft') {
    return c.json({ error: 'Apenas produções em rascunho podem ser iniciadas.' }, 400)
  }

  const production = await prisma.production.update({
    where: { id: productionId },
    data: { status: 'in_production' },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

productionRoutes.post('/:id/complete', async (c) => {
  const productionId = c.req.param('id')
  const userId = c.get('userId') as string

  const existing = await prisma.production.findUnique({
    where: { id: productionId },
    include: {
      product: {
        include: {
          composition: {
            include: { supply: true },
          },
        },
      },
      items: {
        include: {
          product: {
            include: {
              composition: {
                include: { supply: true },
              },
            },
          },
        },
      },
    },
  })

  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'in_production') {
    return c.json({ error: 'Apenas produções em andamento podem ser concluídas.' }, 400)
  }

  const productionItems =
    existing.items.length > 0
      ? existing.items
      : [
          {
            id: existing.id,
            productionId: existing.id,
            productId: existing.productId,
            quantity: existing.quantity,
            product: existing.product,
          },
        ]

  await prisma.$transaction(async (tx) => {
    await tx.production.update({
      where: { id: productionId },
      data: { status: 'completed', completedAt: new Date() },
    })

    for (const item of productionItems) {
      const productStockResult = await tx.stockMovement.aggregate({
        where: { productId: item.productId },
        _sum: { quantity: true },
      })
      const productStockBefore = productStockResult._sum.quantity || 0

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          authorId: userId,
          quantity: item.quantity,
          stockBefore: productStockBefore,
          stockAfter: productStockBefore + item.quantity,
          type: 'production_output',
          referenceId: productionId,
          notes: `Produção #${productionId} — ${item.quantity} ${item.product.unit} de ${item.product.name}`,
        },
      })
    }

    const supplyConsumption = new Map<
      string,
      { quantity: number; unit: string; name: string }
    >()

    for (const item of productionItems) {
      for (const comp of item.product.composition) {
        const quantity = comp.quantity * item.quantity
        const current = supplyConsumption.get(comp.supplyId)

        if (current) {
          current.quantity += quantity
        } else {
          supplyConsumption.set(comp.supplyId, {
            quantity,
            unit: comp.supply.unit,
            name: comp.supply.name,
          })
        }
      }
    }

    for (const [supplyId, comp] of supplyConsumption) {
      const quantity = -comp.quantity
      const supplyStockResult = await tx.stockMovement.aggregate({
        where: { supplyId },
        _sum: { quantity: true },
      })
      const supplyStockBefore = supplyStockResult._sum.quantity || 0

      await tx.stockMovement.create({
        data: {
          supplyId,
          authorId: userId,
          quantity,
          stockBefore: supplyStockBefore,
          stockAfter: supplyStockBefore + quantity,
          type: 'production_consumption',
          referenceId: productionId,
          notes: `Produção #${productionId} — consumo de ${comp.quantity} ${comp.unit} de ${comp.name}`,
        },
      })
    }
  })

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

productionRoutes.post('/:id/cancel', async (c) => {
  const productionId = c.req.param('id')

  const existing = await prisma.production.findUnique({ where: { id: productionId } })
  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status === 'completed') {
    return c.json({ error: 'Produções concluídas não podem ser canceladas.' }, 400)
  }

  const production = await prisma.production.update({
    where: { id: productionId },
    data: { status: 'cancelled' },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

productionRoutes.post('/:id/reverse', async (c) => {
  const productionId = c.req.param('id')
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { reason } = body as { reason: string }

  if (!reason || !reason.trim()) {
    return c.json({ error: 'Motivo do estorno é obrigatório.' }, 400)
  }

  const existing = await prisma.production.findUnique({
    where: { id: productionId },
    include: {
      product: {
        include: {
          composition: {
            include: { supply: true },
          },
        },
      },
      items: {
        include: {
          product: {
            include: {
              composition: {
                include: { supply: true },
              },
            },
          },
        },
      },
    },
  })

  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'completed') {
    return c.json({ error: 'Apenas produções concluídas podem ser estornadas.' }, 400)
  }

  const productionItems =
    existing.items.length > 0
      ? existing.items
      : [
          {
            id: existing.id,
            productionId: existing.id,
            productId: existing.productId,
            quantity: existing.quantity,
            product: existing.product,
          },
        ]

  await prisma.$transaction(async (tx) => {
    await tx.production.update({
      where: { id: productionId },
      data: {
        status: 'in_production',
        completedAt: null,
        reversalReason: reason.trim(),
        reversedBy: userId,
        reversedAt: new Date(),
      },
    })

    for (const item of productionItems) {
      const productStockResult = await tx.stockMovement.aggregate({
        where: { productId: item.productId },
        _sum: { quantity: true },
      })
      const productStockBefore = productStockResult._sum.quantity || 0
      const productQuantity = -item.quantity

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          authorId: userId,
          quantity: productQuantity,
          stockBefore: productStockBefore,
          stockAfter: productStockBefore + productQuantity,
          type: 'production_reversal',
          referenceId: productionId,
          notes: `Estorno da produção #${productionId} — ${item.quantity} ${item.product.unit} de ${item.product.name} | Motivo: ${reason.trim()}`,
        },
      })
    }

    const supplyReturns = new Map<
      string,
      { quantity: number; unit: string; name: string }
    >()

    for (const item of productionItems) {
      for (const comp of item.product.composition) {
        const quantity = comp.quantity * item.quantity
        const current = supplyReturns.get(comp.supplyId)

        if (current) {
          current.quantity += quantity
        } else {
          supplyReturns.set(comp.supplyId, {
            quantity,
            unit: comp.supply.unit,
            name: comp.supply.name,
          })
        }
      }
    }

    for (const [supplyId, comp] of supplyReturns) {
      const supplyStockResult = await tx.stockMovement.aggregate({
        where: { supplyId },
        _sum: { quantity: true },
      })
      const supplyStockBefore = supplyStockResult._sum.quantity || 0

      await tx.stockMovement.create({
        data: {
          supplyId,
          authorId: userId,
          quantity: comp.quantity,
          stockBefore: supplyStockBefore,
          stockAfter: supplyStockBefore + comp.quantity,
          type: 'production_reversal',
          referenceId: productionId,
          notes: `Estorno da produção #${productionId} — devolução de ${comp.quantity} ${comp.unit} de ${comp.name}`,
        },
      })
    }
  })

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

export { productionRoutes }
