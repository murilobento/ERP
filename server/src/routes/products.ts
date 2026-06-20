import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { computeProductPrices } from '../lib/pricing'
import { getProductStock, getProductStockMap } from '../lib/stock'
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
  categoryId: true,
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

productRoutes.get('/', async (c) => {
  const products = await prisma.product.findMany({
    select: {
      ...PRODUCT_SELECT,
      composition: { select: COMPOSITION_SELECT },
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const stockByProduct = await getProductStockMap(
    products.map((product) => product.id)
  )

  const productsWithMeta = products.map((product) => {
    const prices = computeProductPrices(product)
    return { ...product, stock: stockByProduct.get(product.id) ?? 0, ...prices }
  })

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
      composition: {
        select: { quantity: true, supply: { select: { costPrice: true } } },
      },
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  const productsWithPrices = products.map((product) => ({
    ...product,
    ...computeProductPrices(product),
  }))

  if (!includeStock) {
    return c.json({ products: productsWithPrices })
  }

  const stockByProduct = await getProductStockMap(
    products.map((product) => product.id)
  )
  const productsWithStock = productsWithPrices.map((product) => ({
    ...product,
    stock: stockByProduct.get(product.id) ?? 0,
  }))

  return c.json({ products: productsWithStock })
})

productRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, description, unit, margin, status, categoryId } = body

  if (!name) {
    return c.json({ error: 'Nome é obrigatório.' }, 400)
  }

  if (!categoryId) {
    return c.json({ error: 'Categoria é obrigatória.' }, 400)
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || '',
      unit: unit || 'un',
      margin: margin ?? 0,
      status: status || 'active',
      categoryId,
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
      category: { select: { id: true, name: true } },
    },
  })

  if (!product) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const prices = computeProductPrices(product)

  return c.json({
    product,
    stock: await getProductStock(productId),
    ...prices,
  })
})

productRoutes.patch('/:id', async (c) => {
  const productId = c.req.param('id')
  const body = await c.req.json()
  const { name, description, unit, margin, status, categoryId } = body

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const data: { name?: string; description?: string; unit?: string; margin?: number; status?: string; categoryId?: string } = {}
  if (name) data.name = name
  if (description !== undefined) data.description = description
  if (unit) data.unit = unit
  if (margin !== undefined) data.margin = margin
  if (status) data.status = status
  if (categoryId) data.categoryId = categoryId

  const product = await prisma.product.update({
    where: { id: productId },
    data,
    select: PRODUCT_SELECT,
  })

  return c.json({ product })
})

productRoutes.delete('/:id', async (c) => {
  const productId = c.req.param('id')

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      _count: {
        select: { productions: true, productionItems: true, saleItems: true },
      },
    },
  })
  if (!existing) {
    return c.json({ error: 'Produto não encontrado.' }, 404)
  }

  const { productions, productionItems, saleItems } = existing._count
  const reasons: string[] = []
  if (productions > 0) reasons.push('produções')
  if (productionItems > 0) reasons.push('itens de produção')
  if (saleItems > 0) reasons.push('vendas')

  if (reasons.length > 0) {
    return c.json({ error: `Não é possível excluir este produto pois existem ${reasons.join(', ')} vinculados.` }, 400)
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

  return c.json({ stock: await getProductStock(productId) })
})

export { productRoutes }
