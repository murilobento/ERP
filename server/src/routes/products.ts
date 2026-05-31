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
  margin: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

const COMPOSITION_SELECT = {
  id: true,
  supplyId: true,
  quantity: true,
  supply: {
    select: { id: true, name: true, unit: true, costPrice: true },
  },
}

function computeProductPrices(product: { margin: number; composition: { quantity: number; supply: { costPrice: number } }[] }) {
  const costPrice = product.composition.reduce(
    (sum, c) => sum + c.quantity * c.supply.costPrice,
    0
  )
  const salePrice = costPrice * (1 + product.margin / 100)
  return { costPrice, salePrice }
}

productRoutes.get('/', async (c) => {
  const products = await prisma.product.findMany({
    select: {
      ...PRODUCT_SELECT,
      composition: { select: COMPOSITION_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  })

  const productsWithMeta = await Promise.all(
    products.map(async (product) => {
      const stockResult = await prisma.stockMovement.aggregate({
        where: { productId: product.id },
        _sum: { quantity: true },
      })
      const prices = computeProductPrices(product)
      return { ...product, stock: stockResult._sum.quantity || 0, ...prices }
    })
  )

  return c.json({ products: productsWithMeta })
})

productRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const status = c.req.query('status')
  const includeStock = c.req.query('includeStock') === 'true'
  const requestedLimit = Number(c.req.query('limit') || 20)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 20

  if (!q) {
    return c.json({ products: [] })
  }

  const where = {
    name: { contains: q, mode: 'insensitive' as const },
    ...(status && status !== 'all' ? { status } : {}),
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      unit: true,
      margin: true,
      status: true,
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  if (!includeStock) {
    return c.json({ products })
  }

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
  const { name, description, unit, margin, status } = body

  if (!name) {
    return c.json({ error: 'Nome é obrigatório.' }, 400)
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || '',
      unit: unit || 'un',
      margin: margin ?? 0,
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
      composition: { select: COMPOSITION_SELECT },
    },
  })

  if (!product) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const stockResult = await prisma.stockMovement.aggregate({
    where: { productId },
    _sum: { quantity: true },
  })

  const prices = computeProductPrices(product)

  return c.json({
    product,
    stock: stockResult._sum.quantity || 0,
    ...prices,
  })
})

productRoutes.patch('/:id', async (c) => {
  const productId = c.req.param('id')
  const body = await c.req.json()
  const { name, description, unit, margin, status } = body

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const data: { name?: string; description?: string; unit?: string; margin?: number; status?: string } = {}
  if (name) data.name = name
  if (description !== undefined) data.description = description
  if (unit) data.unit = unit
  if (margin !== undefined) data.margin = margin
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
    select: COMPOSITION_SELECT,
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
    select: COMPOSITION_SELECT,
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
