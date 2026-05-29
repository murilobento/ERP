import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const productRoutes = new Hono()

productRoutes.use('*', authMiddleware)

const PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  unit: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

productRoutes.get('/', async (c) => {
  const products = await prisma.product.findMany({
    select: {
      ...PRODUCT_SELECT,
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
    orderBy: { createdAt: 'desc' },
  })

  const productsWithStock = await Promise.all(
    products.map(async (product) => {
      const stockResult = await prisma.stockMovement.aggregate({
        where: { productId: product.id },
        _sum: { quantity: true },
      })
      return { ...product, stock: stockResult._sum.quantity || 0 }
    })
  )

  return c.json({ products: productsWithStock })
})

productRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, description, unit, status } = body

  if (!name) {
    return c.json({ error: 'Nome é obrigatório.' }, 400)
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || '',
      unit: unit || 'un',
      status: status || 'active',
    },
    select: PRODUCT_SELECT,
  })

  return c.json({ product }, 201)
})

productRoutes.get('/:id', async (c) => {
  const productId = c.req.param('id')

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      ...PRODUCT_SELECT,
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
  })

  if (!product) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const stockResult = await prisma.stockMovement.aggregate({
    where: { productId },
    _sum: { quantity: true },
  })

  return c.json({
    product,
    stock: stockResult._sum.quantity || 0,
  })
})

productRoutes.patch('/:id', async (c) => {
  const productId = c.req.param('id')
  const body = await c.req.json()
  const { name, description, unit, status } = body

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const data: { name?: string; description?: string; unit?: string; status?: string } = {}
  if (name) data.name = name
  if (description !== undefined) data.description = description
  if (unit) data.unit = unit
  if (status) data.status = status

  const product = await prisma.product.update({
    where: { id: productId },
    data,
    select: PRODUCT_SELECT,
  })

  return c.json({ product })
})

productRoutes.delete('/:id', async (c) => {
  const productId = c.req.param('id')

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  await prisma.product.delete({ where: { id: productId } })
  return c.json({ ok: true })
})

productRoutes.get('/:id/composition', async (c) => {
  const productId = c.req.param('id')

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const composition = await prisma.productComposition.findMany({
    where: { productId },
    select: {
      id: true,
      supplyId: true,
      quantity: true,
      supply: {
        select: { id: true, name: true, unit: true },
      },
    },
  })

  return c.json({ composition })
})

productRoutes.put('/:id/composition', async (c) => {
  const productId = c.req.param('id')
  const body = await c.req.json()
  const { items } = body as { items: { supplyId: string; quantity: number }[] }

  if (!Array.isArray(items)) {
    return c.json({ error: 'Items deve ser um array.' }, 400)
  }

  for (const item of items) {
    if (!item.supplyId || !item.quantity || item.quantity <= 0) {
      return c.json({ error: 'Cada item deve ter supplyId e quantity (> 0).' }, 400)
    }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  await prisma.$transaction(async (tx) => {
    await tx.productComposition.deleteMany({ where: { productId } })
    if (items.length > 0) {
      await tx.productComposition.createMany({
        data: items.map((item) => ({
          productId,
          supplyId: item.supplyId,
          quantity: item.quantity,
        })),
      })
    }
  })

  const composition = await prisma.productComposition.findMany({
    where: { productId },
    select: {
      id: true,
      supplyId: true,
      quantity: true,
      supply: {
        select: { id: true, name: true, unit: true },
      },
    },
  })

  return c.json({ composition })
})

productRoutes.get('/:id/stock', async (c) => {
  const productId = c.req.param('id')

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const result = await prisma.stockMovement.aggregate({
    where: { productId },
    _sum: { quantity: true },
  })

  return c.json({ stock: result._sum.quantity || 0 })
})

export { productRoutes }
