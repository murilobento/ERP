import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const clientRoutes = new Hono()

clientRoutes.use('*', authMiddleware)

const CLIENT_SELECT = {
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

clientRoutes.get('/', async (c) => {
  const clients = await prisma.client.findMany({
    select: CLIENT_SELECT,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ clients })
})

clientRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, phone, zipCode, street, number, complement, neighborhood, city, state, status } = body

  if (!name || !phone || !zipCode || !street || !number || !neighborhood || !city || !state) {
    return c.json({ error: 'All required fields must be provided' }, 400)
  }

  const client = await prisma.client.create({
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
    select: CLIENT_SELECT,
  })

  return c.json({ client }, 201)
})

clientRoutes.patch('/:id', async (c) => {
  const clientId = c.req.param('id')
  const body = await c.req.json()
  const { name, phone, zipCode, street, number, complement, neighborhood, city, state, status } = body

  const existing = await prisma.client.findUnique({ where: { id: clientId } })
  if (!existing) {
    return c.json({ error: 'Client not found' }, 404)
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

  const client = await prisma.client.update({
    where: { id: clientId },
    data,
    select: CLIENT_SELECT,
  })

  return c.json({ client })
})

clientRoutes.delete('/:id', async (c) => {
  const clientId = c.req.param('id')

  const existing = await prisma.client.findUnique({ where: { id: clientId } })
  if (!existing) {
    return c.json({ error: 'Client not found' }, 404)
  }

  await prisma.client.delete({ where: { id: clientId } })
  return c.json({ ok: true })
})

export { clientRoutes }
