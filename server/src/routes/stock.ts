import { Hono } from 'hono'
import prisma from '../lib/prisma'
import {
  getProductStockMap,
  getSupplyStockMap,
  movementParentEntity,
  recordAdjustment,
  recordAdjustmentReversal,
} from '../lib/stock'
import { authMiddleware } from '../middleware/auth'
import { requireRole } from '../lib/rbac'

const stockRoutes = new Hono()

stockRoutes.use('*', authMiddleware)

stockRoutes.get('/movements', async (c) => {
  const type = c.req.query('type')
  const referenceId = c.req.query('referenceId')

  const where: { type?: string; referenceId?: string } = {}
  if (type) where.type = type
  if (referenceId) where.referenceId = referenceId

  const movements = await prisma.stockMovement.findMany({
    where,
    select: {
      id: true,
      productId: true,
      supplyId: true,
      quantity: true,
      stockBefore: true,
      stockAfter: true,
      type: true,
      referenceId: true,
      notes: true,
      createdAt: true,
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const saleIds = new Set<string>()
  const purchaseIds = new Set<string>()
  const productionIds = new Set<string>()
  const adjustmentIds = new Set<string>()

  for (const m of movements) {
    if (!m.referenceId) continue
    const parent = movementParentEntity(m.type)
    if (parent === 'sale') saleIds.add(m.referenceId)
    else if (parent === 'purchase') purchaseIds.add(m.referenceId)
    else if (parent === 'production') productionIds.add(m.referenceId)
    else if (parent === 'adjustment') adjustmentIds.add(m.referenceId)
  }

  const [sales, purchases, productions, adjustments] = await Promise.all([
    saleIds.size > 0
      ? prisma.sale.findMany({
          where: { id: { in: [...saleIds] } },
          select: {
            id: true,
            customer: true,
            status: true,
            createdAt: true,
            deliveredAt: true,
            deliveryDate: true,
            completedAt: true,
          },
        })
      : [],
    purchaseIds.size > 0
      ? prisma.purchase.findMany({
          where: { id: { in: [...purchaseIds] } },
          select: {
            id: true,
            supplier: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        })
      : [],
    productionIds.size > 0
      ? prisma.production.findMany({
          where: { id: { in: [...productionIds] } },
          select: {
            id: true,
            quantity: true,
            status: true,
            createdAt: true,
            completedAt: true,
            product: { select: { id: true, name: true, unit: true } },
          },
        })
      : [],
    adjustmentIds.size > 0
      ? prisma.stockAdjustment.findMany({
          where: { id: { in: [...adjustmentIds] } },
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
            completedAt: true,
            reversedAt: true,
            reversalReason: true,
          },
        })
      : [],
  ])

  const salesMap = new Map(sales.map((s) => [s.id, s]))
  const purchasesMap = new Map(purchases.map((p) => [p.id, p]))
  const productionsMap = new Map(productions.map((p) => [p.id, p]))
  const adjustmentsMap = new Map(adjustments.map((a) => [a.id, a]))

  const enriched = movements.map((m) => {
    let reference: Record<string, unknown> | null = null

    if (m.referenceId) {
      const parent = movementParentEntity(m.type)
      if (parent === 'sale') {
        const sale = salesMap.get(m.referenceId)
        if (sale) reference = { type: 'sale' as const, data: sale }
      } else if (parent === 'purchase') {
        const purchase = purchasesMap.get(m.referenceId)
        if (purchase) reference = { type: 'purchase' as const, data: purchase }
      } else if (parent === 'production') {
        const production = productionsMap.get(m.referenceId)
        if (production) reference = { type: 'production' as const, data: production }
      } else if (parent === 'adjustment') {
        const adjustment = adjustmentsMap.get(m.referenceId)
        if (adjustment) reference = { type: 'adjustment' as const, data: adjustment }
      }
    }

    return { ...m, reference }
  })

  return c.json({ movements: enriched })
})

stockRoutes.get('/adjustments', async (c) => {
  const adjustments = await prisma.stockAdjustment.findMany({
    select: {
      id: true,
      status: true,
      itemType: true,
      productId: true,
      supplyId: true,
      quantity: true,
      reason: true,
      authorId: true,
      completedById: true,
      completedAt: true,
      reversedById: true,
      reversedAt: true,
      reversalReason: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      completedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reversedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ adjustments })
})

stockRoutes.get('/adjustments/:id', async (c) => {
  const id = c.req.param('id')

  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      itemType: true,
      productId: true,
      supplyId: true,
      quantity: true,
      reason: true,
      authorId: true,
      completedById: true,
      completedAt: true,
      reversedById: true,
      reversedAt: true,
      reversalReason: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      completedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reversedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!adjustment) {
    return c.json({ error: 'Acerto não encontrado.' }, 404)
  }

  return c.json({ adjustment })
})

stockRoutes.post('/adjustments', requireRole('admin', 'manager'), async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { itemType, itemId, quantity, reason } = body as {
    itemType: 'product' | 'supply'
    itemId: string
    quantity: number
    reason: string
  }

  if (itemType !== 'product' && itemType !== 'supply') {
    return c.json({ error: 'Tipo de item inválido.' }, 400)
  }

  if (!itemId) {
    return c.json({ error: 'Item é obrigatório.' }, 400)
  }

  if (!Number.isFinite(quantity) || quantity === 0) {
    return c.json({ error: 'Quantidade deve ser diferente de zero.' }, 400)
  }

  if (!reason || !reason.trim()) {
    return c.json({ error: 'Motivo é obrigatório.' }, 400)
  }

  if (itemType === 'product') {
    const product = await prisma.product.findUnique({ where: { id: itemId } })
    if (!product) {
      return c.json({ error: 'Produto não encontrado.' }, 404)
    }
  } else {
    const supply = await prisma.supply.findUnique({ where: { id: itemId } })
    if (!supply) {
      return c.json({ error: 'Insumo não encontrado.' }, 404)
    }
  }

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      itemType,
      productId: itemType === 'product' ? itemId : null,
      supplyId: itemType === 'supply' ? itemId : null,
      quantity,
      reason: reason.trim(),
      authorId: userId,
    },
    select: {
      id: true,
      status: true,
      itemType: true,
      productId: true,
      supplyId: true,
      quantity: true,
      reason: true,
      authorId: true,
      completedById: true,
      completedAt: true,
      reversedById: true,
      reversedAt: true,
      reversalReason: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      completedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reversedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return c.json({ adjustment }, 201)
})

stockRoutes.patch('/adjustments/:id', requireRole('admin', 'manager'), async (c) => {
  const _userId = c.get('userId') as string
  const id = c.req.param('id')
  const body = await c.req.json()
  const { itemType, itemId, quantity, reason } = body as {
    itemType?: 'product' | 'supply'
    itemId?: string
    quantity?: number
    reason?: string
  }

  const existing = await prisma.stockAdjustment.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'Acerto não encontrado.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas acertos pendentes podem ser editados.' }, 400)
  }

  const finalItemType = itemType || existing.itemType
  const finalItemId = itemId || (existing.productId || existing.supplyId)
  const finalQuantity = quantity ?? existing.quantity
  const finalReason = reason !== undefined ? reason.trim() : existing.reason

  if (finalItemType !== 'product' && finalItemType !== 'supply') {
    return c.json({ error: 'Tipo de item inválido.' }, 400)
  }

  if (!finalItemId) {
    return c.json({ error: 'Item é obrigatório.' }, 400)
  }

  if (!Number.isFinite(finalQuantity) || finalQuantity === 0) {
    return c.json({ error: 'Quantidade deve ser diferente de zero.' }, 400)
  }

  if (finalItemType === 'product') {
    const product = await prisma.product.findUnique({ where: { id: finalItemId } })
    if (!product) {
      return c.json({ error: 'Produto não encontrado.' }, 404)
    }
  } else {
    const supply = await prisma.supply.findUnique({ where: { id: finalItemId } })
    if (!supply) {
      return c.json({ error: 'Insumo não encontrado.' }, 404)
    }
  }

  const adjustment = await prisma.stockAdjustment.update({
    where: { id },
    data: {
      itemType: finalItemType,
      productId: finalItemType === 'product' ? finalItemId : null,
      supplyId: finalItemType === 'supply' ? finalItemId : null,
      quantity: finalQuantity,
      reason: finalReason,
    },
    select: {
      id: true,
      status: true,
      itemType: true,
      productId: true,
      supplyId: true,
      quantity: true,
      reason: true,
      authorId: true,
      completedById: true,
      completedAt: true,
      reversedById: true,
      reversedAt: true,
      reversalReason: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      completedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reversedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return c.json({ adjustment })
})

stockRoutes.post('/adjustments/:id/complete', requireRole('admin', 'manager'), async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')

  const existing = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      product: true,
      supply: true,
    },
  })

  if (!existing) {
    return c.json({ error: 'Acerto não encontrado.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas acertos pendentes podem ser concluídos.' }, 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockAdjustment.update({
      where: { id },
      data: {
        status: 'completed',
        completedById: userId,
        completedAt: new Date(),
      },
    })

    const isProduct = existing.itemType === 'product'
    const item = isProduct
      ? {
          id: existing.productId || '',
          name: existing.product?.name || 'Produto',
          unit: existing.product?.unit || 'un',
        }
      : {
          id: existing.supplyId || '',
          name: existing.supply?.name || 'Insumo',
          unit: existing.supply?.unit || 'un',
        }

    await recordAdjustment(tx, {
      adjustmentId: id,
      authorId: userId,
      itemType: isProduct ? 'product' : 'supply',
      item,
      quantity: existing.quantity,
      reason: existing.reason,
    })
  })

  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      itemType: true,
      productId: true,
      supplyId: true,
      quantity: true,
      reason: true,
      authorId: true,
      completedById: true,
      completedAt: true,
      reversedById: true,
      reversedAt: true,
      reversalReason: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      completedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reversedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return c.json({ adjustment })
})

stockRoutes.post('/adjustments/:id/reverse', requireRole('admin', 'manager'), async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const body = await c.req.json()
  const { reason } = body as { reason: string }

  if (!reason || !reason.trim()) {
    return c.json({ error: 'Motivo do estorno é obrigatório.' }, 400)
  }

  const existing = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      product: true,
      supply: true,
    },
  })

  if (!existing) {
    return c.json({ error: 'Acerto não encontrado.' }, 404)
  }

  if (existing.status !== 'completed') {
    return c.json({ error: 'Apenas acertos concluídos podem ser estornados.' }, 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })
  const authorName = user ? `${user.firstName} ${user.lastName}` : userId

  await prisma.$transaction(async (tx) => {
    await tx.stockAdjustment.update({
      where: { id },
      data: {
        status: 'reversed',
        reversedById: userId,
        reversedAt: new Date(),
        reversalReason: reason.trim(),
      },
    })

    const isProduct = existing.itemType === 'product'
    const item = isProduct
      ? {
          id: existing.productId || '',
          name: existing.product?.name || 'Produto',
          unit: existing.product?.unit || 'un',
        }
      : {
          id: existing.supplyId || '',
          name: existing.supply?.name || 'Insumo',
          unit: existing.supply?.unit || 'un',
        }

    await recordAdjustmentReversal(tx, {
      adjustmentId: id,
      authorId: userId,
      authorName,
      itemType: isProduct ? 'product' : 'supply',
      item,
      quantity: existing.quantity,
      reason: reason.trim(),
    })
  })

  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      itemType: true,
      productId: true,
      supplyId: true,
      quantity: true,
      reason: true,
      authorId: true,
      completedById: true,
      completedAt: true,
      reversedById: true,
      reversedAt: true,
      reversalReason: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
      supply: {
        select: { id: true, name: true, unit: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      completedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      reversedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  return c.json({ adjustment })
})

stockRoutes.delete('/adjustments/:id', requireRole('admin', 'manager'), async (c) => {
  const id = c.req.param('id')

  const existing = await prisma.stockAdjustment.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'Acerto não encontrado.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas acertos pendentes podem ser removidos.' }, 400)
  }

  await prisma.stockAdjustment.delete({ where: { id } })

  return c.json({ success: true })
})

stockRoutes.get('/balances', async (c) => {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      unit: true,
    },
  })

  const supplies = await prisma.supply.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      unit: true,
      packageUnit: true,
      packageQuantity: true,
    },
  })

  const [productStock, supplyStock] = await Promise.all([
    getProductStockMap(products.map((product) => product.id)),
    getSupplyStockMap(supplies.map((supply) => supply.id)),
  ])

  const productBalances = products.map((product) => ({
    type: 'product' as const,
    id: product.id,
    name: product.name,
    unit: product.unit,
    stock: productStock.get(product.id) ?? 0,
  }))

  const supplyBalances = supplies.map((supply) => ({
    type: 'supply' as const,
    id: supply.id,
    name: supply.name,
    unit: supply.unit,
    packageUnit: supply.packageUnit,
    packageQuantity: supply.packageQuantity,
    stock: supplyStock.get(supply.id) ?? 0,
  }))

  return c.json({ balances: [...productBalances, ...supplyBalances] })
})

export { stockRoutes }
