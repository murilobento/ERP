import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { computeKitPricing } from '../lib/pricing.js'
import { authMiddleware } from '../middleware/auth.js'

const kitRoutes = new Hono()

kitRoutes.use('*', authMiddleware)

const KIT_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  discountType: true,
  discountValue: true,
  createdAt: true,
  updatedAt: true,
}

const KIT_ITEM_SELECT = {
  id: true,
  productId: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      unit: true,
      status: true,
      margin: true,
      composition: {
        select: {
          quantity: true,
          supply: { select: { costPrice: true } },
        },
      },
    },
  },
}

kitRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const where = status ? { status } : {}

  const kits = await prisma.kit.findMany({
    where,
    select: {
      ...KIT_SELECT,
      items: { select: KIT_ITEM_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  })

  const kitsWithPricing = kits.map((kit) => ({
    ...kit,
    ...computeKitPricing(kit),
  }))

  return c.json({ kits: kitsWithPricing })
})

kitRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const status = c.req.query('status')
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 20), 1), 50)

  if (!q) {
    return c.json({ kits: [] })
  }

  const where = {
    name: { contains: q, mode: 'insensitive' as const },
    ...(status && status !== 'all' ? { status } : {}),
  }

  const kits = await prisma.kit.findMany({
    where,
    select: {
      ...KIT_SELECT,
      items: { select: KIT_ITEM_SELECT },
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  const kitsWithPricing = kits.map((kit) => ({
    ...kit,
    ...computeKitPricing(kit),
  }))

  return c.json({ kits: kitsWithPricing })
})

kitRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, description, status, discountType, discountValue, items } = body as {
    name: string
    description?: string
    status?: string
    discountType?: string
    discountValue?: number
    items: { productId: string; quantity: number }[]
  }

  if (!name) {
    return c.json({ error: 'Nome é obrigatório.' }, 400)
  }

  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: 'Pelo menos um item é obrigatório.' }, 400)
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return c.json({ error: 'Cada item deve ter produto e quantidade (> 0).' }, 400)
    }
  }

  const productIds = items.map((item) => item.productId)
  const uniqueProductIds = [...new Set(productIds)]
  if (uniqueProductIds.length !== productIds.length) {
    return c.json({ error: 'Não é permitido repetir o mesmo produto no kit.' }, 400)
  }

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, status: 'active' },
  })
  if (products.length !== uniqueProductIds.length) {
    return c.json({ error: 'Um ou mais produtos não encontrados ou inativos.' }, 404)
  }

  const validDiscountType =
    discountType === 'percentage' ? 'percentage' : 'fixed'
  const validDiscountValue = Math.max(0, discountValue ?? 0)

  if (validDiscountType === 'percentage' && validDiscountValue > 100) {
    return c.json({ error: 'Desconto percentual não pode exceder 100%.' }, 400)
  }

  const kit = await prisma.kit.create({
    data: {
      name,
      description: description || '',
      status: status || 'active',
      discountType: validDiscountType,
      discountValue: validDiscountValue,
      items: {
        createMany: {
          data: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    },
    select: {
      ...KIT_SELECT,
      items: { select: KIT_ITEM_SELECT },
    },
  })

  return c.json({ kit: { ...kit, ...computeKitPricing(kit) } }, 201)
})

kitRoutes.get('/:id', async (c) => {
  const kitId = c.req.param('id')

  const kit = await prisma.kit.findUnique({
    where: { id: kitId },
    select: {
      ...KIT_SELECT,
      items: { select: KIT_ITEM_SELECT },
    },
  })

  if (!kit) {
    return c.json({ error: 'Kit não encontrado.' }, 404)
  }

  return c.json({ kit: { ...kit, ...computeKitPricing(kit) } })
})

kitRoutes.patch('/:id', async (c) => {
  const kitId = c.req.param('id')
  const body = await c.req.json()
  const { name, description, status, discountType, discountValue, items } = body as {
    name?: string
    description?: string
    status?: string
    discountType?: string
    discountValue?: number
    items?: { productId: string; quantity: number }[]
  }

  const existing = await prisma.kit.findUnique({ where: { id: kitId } })
  if (!existing) {
    return c.json({ error: 'Kit não encontrado.' }, 404)
  }

  if (items) {
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Pelo menos um item é obrigatório.' }, 400)
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return c.json({ error: 'Cada item deve ter produto e quantidade (> 0).' }, 400)
      }
    }

    const productIds = items.map((item) => item.productId)
    const uniqueProductIds = [...new Set(productIds)]
    if (uniqueProductIds.length !== productIds.length) {
      return c.json({ error: 'Não é permitido repetir o mesmo produto no kit.' }, 400)
    }

    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds }, status: 'active' },
    })
    if (products.length !== uniqueProductIds.length) {
      return c.json({ error: 'Um ou mais produtos não encontrados ou inativos.' }, 404)
    }
  }

  const validDiscountType =
    discountType === 'percentage' ? 'percentage' : 'fixed'
  const validDiscountValue =
    discountValue !== undefined ? Math.max(0, discountValue) : undefined

  if (
    validDiscountType === 'percentage' &&
    validDiscountValue !== undefined &&
    validDiscountValue > 100
  ) {
    return c.json({ error: 'Desconto percentual não pode exceder 100%.' }, 400)
  }

  await prisma.$transaction(async (tx) => {
    const data: {
      name?: string
      description?: string
      status?: string
      discountType?: string
      discountValue?: number
    } = {}
    if (name) data.name = name
    if (description !== undefined) data.description = description
    if (status) data.status = status
    if (discountType) data.discountType = validDiscountType
    if (discountValue !== undefined) data.discountValue = validDiscountValue

    await tx.kit.update({ where: { id: kitId }, data })

    if (items && items.length > 0) {
      await tx.kitItem.deleteMany({ where: { kitId } })
      await tx.kitItem.createMany({
        data: items.map((item) => ({
          kitId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
    }
  })

  const kit = await prisma.kit.findUnique({
    where: { id: kitId },
    select: {
      ...KIT_SELECT,
      items: { select: KIT_ITEM_SELECT },
    },
  })

  return c.json({ kit: { ...kit!, ...computeKitPricing(kit!) } })
})

kitRoutes.delete('/:id', async (c) => {
  const kitId = c.req.param('id')

  const existing = await prisma.kit.findUnique({
    where: { id: kitId },
    include: {
      _count: { select: { saleItems: true } },
    },
  })
  if (!existing) {
    return c.json({ error: 'Kit não encontrado.' }, 404)
  }

  if (existing._count.saleItems > 0) {
    return c.json({ error: 'Não é possível excluir este kit pois existem vendas vinculadas.' }, 400)
  }

  await prisma.kit.delete({ where: { id: kitId } })
  return c.json({ ok: true })
})

export { kitRoutes }
