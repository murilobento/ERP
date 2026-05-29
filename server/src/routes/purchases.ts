import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const purchaseRoutes = new Hono()

purchaseRoutes.use('*', authMiddleware)

const PURCHASE_SELECT = {
  id: true,
  supplier: true,
  status: true,
  notes: true,
  reversalReason: true,
  reversedBy: true,
  reversedAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      supplyId: true,
      packages: true,
      quantity: true,
      supply: {
        select: { id: true, name: true, unit: true, packageUnit: true, packageQuantity: true },
      },
    },
  },
}

purchaseRoutes.get('/', async (c) => {
  const status = c.req.query('status')

  const where = status ? { status } : {}

  const purchases = await prisma.purchase.findMany({
    where,
    select: PURCHASE_SELECT,
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ purchases })
})

purchaseRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { supplier, notes, items } = body as {
    supplier: string
    notes?: string
    items: { supplyId: string; packages: number }[]
  }

  if (!supplier) {
    return c.json({ error: 'Fornecedor é obrigatório.' }, 400)
  }

  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: 'Pelo menos um item é obrigatório.' }, 400)
  }

  for (const item of items) {
    if (!item.supplyId || !item.packages || item.packages <= 0) {
      return c.json({ error: 'Cada item deve ter insumo e número de embalagens (> 0).' }, 400)
    }
  }

  const supplyIds = items.map((i) => i.supplyId)
  const supplies = await prisma.supply.findMany({
    where: { id: { in: supplyIds } },
  })

  if (supplies.length !== supplyIds.length) {
    return c.json({ error: 'Um ou mais insumos não encontrados.' }, 404)
  }

  const supplyMap = new Map(supplies.map((s) => [s.id, s]))

  const itemsWithQuantity = items.map((item) => ({
    supplyId: item.supplyId,
    packages: item.packages,
    quantity: item.packages * (supplyMap.get(item.supplyId)?.packageQuantity || 1),
  }))

  const purchase = await prisma.purchase.create({
    data: {
      supplier,
      notes: notes || '',
      status: 'pending',
      items: {
        createMany: { data: itemsWithQuantity },
      },
    },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase }, 201)
})

purchaseRoutes.get('/:id', async (c) => {
  const purchaseId = c.req.param('id')

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  if (!purchase) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  return c.json({ purchase })
})

purchaseRoutes.patch('/:id', async (c) => {
  const purchaseId = c.req.param('id')
  const body = await c.req.json()
  const { supplier, notes, items } = body as {
    supplier?: string
    notes?: string
    items?: { supplyId: string; packages: number }[]
  }

  const existing = await prisma.purchase.findUnique({ where: { id: purchaseId } })
  if (!existing) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas compras pendentes podem ser editadas.' }, 400)
  }

  if (items) {
    for (const item of items) {
      if (!item.supplyId || !item.packages || item.packages <= 0) {
        return c.json({ error: 'Cada item deve ter insumo e número de embalagens (> 0).' }, 400)
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const data: { supplier?: string; notes?: string } = {}
    if (supplier) data.supplier = supplier
    if (notes !== undefined) data.notes = notes

    await tx.purchase.update({
      where: { id: purchaseId },
      data,
    })

    if (items && items.length > 0) {
      await tx.purchaseItem.deleteMany({ where: { purchaseId } })

      const supplyIds = items.map((i) => i.supplyId)
      const supplies = await tx.supply.findMany({
        where: { id: { in: supplyIds } },
      })
      const supplyMap = new Map(supplies.map((s) => [s.id, s]))

      const itemsWithQuantity = items.map((item) => ({
        purchaseId,
        supplyId: item.supplyId,
        packages: item.packages,
        quantity: item.packages * (supplyMap.get(item.supplyId)?.packageQuantity || 1),
      }))

      await tx.purchaseItem.createMany({ data: itemsWithQuantity })
    }
  })

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase })
})

purchaseRoutes.post('/:id/complete', async (c) => {
  const purchaseId = c.req.param('id')

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: {
        include: {
          supply: true,
        },
      },
    },
  })

  if (!existing) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas compras pendentes podem ser concluídas.' }, 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'completed',
        reversalReason: '',
        reversedBy: null,
        reversedAt: null,
      },
    })

    for (const item of existing.items) {
      await tx.stockMovement.create({
        data: {
          supplyId: item.supplyId,
          quantity: item.quantity,
          type: 'purchase',
          referenceId: purchaseId,
          notes: `Compra de ${existing.supplier} — ${item.packages} ${item.supply.packageUnit || 'embalagem'}(s) de ${item.supply.name} → ${item.quantity} ${item.supply.unit}`,
        },
      })
    }
  })

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase })
})

purchaseRoutes.post('/:id/reverse', async (c) => {
  const purchaseId = c.req.param('id')
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { reason } = body as { reason: string }

  if (!reason || !reason.trim()) {
    return c.json({ error: 'Motivo do estorno é obrigatório.' }, 400)
  }

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: {
        include: {
          supply: true,
        },
      },
    },
  })

  if (!existing) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  if (existing.status !== 'completed') {
    return c.json({ error: 'Apenas compras concluídas podem ser estornadas.' }, 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })

  const authorName = user ? `${user.firstName} ${user.lastName}` : userId

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'pending',
        reversalReason: reason.trim(),
        reversedBy: userId,
        reversedAt: new Date(),
      },
    })

    for (const item of existing.items) {
      await tx.stockMovement.create({
        data: {
          supplyId: item.supplyId,
          quantity: -item.quantity,
          type: 'purchase_reversal',
          referenceId: purchaseId,
          notes: `Estorno da compra de ${existing.supplier} — ${item.quantity} ${item.supply.unit} de ${item.supply.name} | Motivo: ${reason.trim()} | Autor: ${authorName}`,
        },
      })
    }
  })

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase })
})

export { purchaseRoutes }
