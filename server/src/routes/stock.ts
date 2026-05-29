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
      type: true,
      referenceId: true,
      notes: true,
      createdAt: true,
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
