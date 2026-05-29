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
  const { productId, quantity, notes } = body

  if (!productId) {
    return c.json({ error: 'Produto é obrigatório.' }, 400)
  }
  if (!quantity || quantity <= 0) {
    return c.json({ error: 'Quantidade deve ser maior que zero.' }, 400)
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const production = await prisma.production.create({
    data: {
      productId,
      quantity,
      notes: notes || '',
      status: 'draft',
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
    },
  })

  if (!production) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  const compositionNeeded = production.product.composition.map((item) => ({
    supplyId: item.supplyId,
    supplyName: item.supply.name,
    unit: item.supply.unit,
    needed: item.quantity * production.quantity,
  }))

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
  const { productId, quantity, notes } = body

  const existing = await prisma.production.findUnique({ where: { id: productionId } })
  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'draft') {
    return c.json({ error: 'Apenas produções em rascunho podem ser editadas.' }, 400)
  }

  const data: { productId?: string; quantity?: number; notes?: string } = {}
  if (productId) data.productId = productId
  if (quantity !== undefined) data.quantity = quantity
  if (notes !== undefined) data.notes = notes

  const production = await prisma.production.update({
    where: { id: productionId },
    data,
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
    },
  })

  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'in_production') {
    return c.json({ error: 'Apenas produções em andamento podem ser concluídas.' }, 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.production.update({
      where: { id: productionId },
      data: { status: 'completed', completedAt: new Date() },
    })

    await tx.stockMovement.create({
      data: {
        productId: existing.productId,
        quantity: existing.quantity,
        type: 'production_output',
        referenceId: productionId,
        notes: `Produção #${productionId} — ${existing.quantity} ${existing.product.unit} de ${existing.product.name}`,
      },
    })

    for (const comp of existing.product.composition) {
      await tx.stockMovement.create({
        data: {
          supplyId: comp.supplyId,
          quantity: -(comp.quantity * existing.quantity),
          type: 'production_consumption',
          referenceId: productionId,
          notes: `Produção #${productionId} — consumo de ${comp.quantity * existing.quantity} ${comp.supply.unit} de ${comp.supply.name}`,
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
    },
  })

  if (!existing) {
    return c.json({ error: 'Produção não encontrada.' }, 404)
  }

  if (existing.status !== 'completed') {
    return c.json({ error: 'Apenas produções concluídas podem ser estornadas.' }, 400)
  }

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

    await tx.stockMovement.create({
      data: {
        productId: existing.productId,
        quantity: -existing.quantity,
        type: 'production_reversal',
        referenceId: productionId,
        notes: `Estorno da produção #${productionId} — ${existing.quantity} ${existing.product.unit} de ${existing.product.name} | Motivo: ${reason.trim()}`,
      },
    })

    for (const comp of existing.product.composition) {
      await tx.stockMovement.create({
        data: {
          supplyId: comp.supplyId,
          quantity: comp.quantity * existing.quantity,
          type: 'production_reversal',
          referenceId: productionId,
          notes: `Estorno da produção #${productionId} — devolução de ${comp.quantity * existing.quantity} ${comp.supply.unit} de ${comp.supply.name}`,
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
