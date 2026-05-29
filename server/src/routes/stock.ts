import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

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

  return c.json({ movements })
})

stockRoutes.post('/adjustments', async (c) => {
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

  if (!Number.isInteger(quantity) || quantity === 0) {
    return c.json({ error: 'Quantidade deve ser um número inteiro diferente de zero.' }, 400)
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

  const stockResult = await prisma.stockMovement.aggregate({
    where:
      itemType === 'product'
        ? { productId: itemId }
        : { supplyId: itemId },
    _sum: { quantity: true },
  })
  const stockBefore = stockResult._sum.quantity || 0

  const movement = await prisma.stockMovement.create({
    data: {
      productId: itemType === 'product' ? itemId : null,
      supplyId: itemType === 'supply' ? itemId : null,
      authorId: userId,
      quantity,
      stockBefore,
      stockAfter: stockBefore + quantity,
      type: 'adjustment',
      notes: reason.trim(),
    },
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
  })

  return c.json({ movement }, 201)
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

  const productBalances = await Promise.all(
    products.map(async (product) => {
      const result = await prisma.stockMovement.aggregate({
        where: { productId: product.id },
        _sum: { quantity: true },
      })
      return {
        type: 'product' as const,
        id: product.id,
        name: product.name,
        unit: product.unit,
        stock: result._sum.quantity || 0,
      }
    })
  )

  const supplyBalances = await Promise.all(
    supplies.map(async (supply) => {
      const result = await prisma.stockMovement.aggregate({
        where: { supplyId: supply.id },
        _sum: { quantity: true },
      })
      return {
        type: 'supply' as const,
        id: supply.id,
        name: supply.name,
        unit: supply.unit,
        packageUnit: supply.packageUnit,
        packageQuantity: supply.packageQuantity,
        stock: result._sum.quantity || 0,
      }
    })
  )

  return c.json({ balances: [...productBalances, ...supplyBalances] })
})

export { stockRoutes }
