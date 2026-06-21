import { Hono } from 'hono'
import prisma from '../lib/prisma'
import {
  expandConsumption,
  getSupplyStockMap,
  recordProductionCompletion,
  recordProductionReversal,
  StockLedgerError,
} from '../lib/stock'
import { authMiddleware } from '../middleware/auth'
import { requireRole } from '../lib/rbac'

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

productionRoutes.post('/', requireRole('admin', 'manager', 'operator'), async (c) => {
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

  const compositionNeeded = Array.from(
    expandConsumption(productionItems),
    ([supplyId, consumed]) => ({
      supplyId,
      supplyName: consumed.name,
      unit: consumed.unit,
      needed: consumed.quantity,
    })
  )
  const stockBySupply = await getSupplyStockMap(
    compositionNeeded.map((item) => item.supplyId)
  )
  const suppliesStockCheck = compositionNeeded.map((item) => {
    const available = stockBySupply.get(item.supplyId) ?? 0
    return {
      ...item,
      available,
      sufficient: available >= item.needed,
    }
  })

  return c.json({ production, compositionNeeded: suppliesStockCheck })
})

productionRoutes.patch('/:id', requireRole('admin', 'manager', 'operator'), async (c) => {
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

productionRoutes.post('/:id/start', requireRole('admin', 'manager', 'operator'), async (c) => {
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

productionRoutes.post('/:id/complete', requireRole('admin', 'manager', 'operator'), async (c) => {
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

  try {
    await prisma.$transaction(async (tx) => {
      await tx.production.update({
        where: { id: productionId },
        data: { status: 'completed', completedAt: new Date() },
      })

      await recordProductionCompletion(tx, {
        productionId,
        authorId: userId,
        items: productionItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          product: item.product,
        })),
      })
    })
  } catch (err) {
    if (err instanceof StockLedgerError) {
      return c.json({ error: err.message }, 400)
    }
    throw err
  }

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

productionRoutes.post('/:id/cancel', requireRole('admin', 'manager', 'operator'), async (c) => {
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

productionRoutes.post('/:id/reverse', requireRole('admin', 'manager', 'operator'), async (c) => {
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

    await recordProductionReversal(tx, {
      productionId,
      authorId: userId,
      reason: reason.trim(),
      items: productionItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      })),
    })
  })

  const production = await prisma.production.findUnique({
    where: { id: productionId },
    select: PRODUCTION_SELECT,
  })

  return c.json({ production })
})

export { productionRoutes }
