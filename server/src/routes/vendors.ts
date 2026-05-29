import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const vendorRoutes = new Hono()

vendorRoutes.use('*', authMiddleware)

const VENDOR_SELECT = {
  id: true,
  name: true,
  phone: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

vendorRoutes.get('/', async (c) => {
  const vendors = await prisma.vendor.findMany({
    select: VENDOR_SELECT,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ vendors })
})

vendorRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const status = c.req.query('status')
  const requestedLimit = Number(c.req.query('limit') || 20)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 20

  if (!q) {
    return c.json({ vendors: [] })
  }

  const vendors = await prisma.vendor.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
      ...(status && status !== 'all' ? { status } : {}),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
    },
    orderBy: { name: 'asc' },
    take: limit,
  })

  return c.json({ vendors })
})

vendorRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, phone, zipCode, street, number, complement, neighborhood, city, state, status } = body

  if (!name || !phone || !zipCode || !street || !number || !neighborhood || !city || !state) {
    return c.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, 400)
  }

  const vendor = await prisma.vendor.create({
    data: {
      name,
      phone,
      zipCode,
      street,
      number,
      complement: complement || '',
      neighborhood,
      city,
      state,
      status: status || 'active',
    },
    select: VENDOR_SELECT,
  })

  return c.json({ vendor }, 201)
})

vendorRoutes.patch('/:id', async (c) => {
  const vendorId = c.req.param('id')
  const body = await c.req.json()
  const { name, phone, zipCode, street, number, complement, neighborhood, city, state, status } = body

  const existing = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!existing) {
    return c.json({ error: 'Fornecedor não encontrado.' }, 404)
  }

  const data: {
    name?: string
    phone?: string
    zipCode?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    status?: string
  } = {}
  if (name) data.name = name
  if (phone) data.phone = phone
  if (zipCode) data.zipCode = zipCode
  if (street) data.street = street
  if (number) data.number = number
  if (complement !== undefined) data.complement = complement
  if (neighborhood) data.neighborhood = neighborhood
  if (city) data.city = city
  if (state) data.state = state
  if (status) data.status = status

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data,
    select: VENDOR_SELECT,
  })

  return c.json({ vendor })
})

vendorRoutes.delete('/:id', async (c) => {
  const vendorId = c.req.param('id')

  const existing = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!existing) {
    return c.json({ error: 'Fornecedor não encontrado.' }, 404)
  }

  await prisma.vendor.delete({ where: { id: vendorId } })
  return c.json({ ok: true })
})

export { vendorRoutes }
