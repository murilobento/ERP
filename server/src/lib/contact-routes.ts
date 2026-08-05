import { Hono } from 'hono'
import type { PrismaClient } from '@prisma/client'
import prisma from './prisma.js'
import { authMiddleware } from '../middleware/auth.js'

interface ContactRoutesConfig {
  model: keyof Pick<PrismaClient, 'client' | 'vendor'>
  entityName: string
  responseKey: string
  pluralResponseKey: string
  detailSelect?: Record<string, unknown>
}

const CONTACT_SELECT = {
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

const SEARCH_SELECT = {
  id: true,
  name: true,
  phone: true,
  status: true,
}

const CONTACT_FIELDS = ['name', 'phone', 'zipCode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'status'] as const

const STATUS_VALUES = ['active', 'inactive'] as const

export function createContactRoutes(config: ContactRoutesConfig) {
  const { model, entityName, responseKey, pluralResponseKey, detailSelect } = config
  const router = new Hono()

  router.use('*', authMiddleware)

  router.get('/', async (c) => {
    const entities = await prisma[model].findMany({
      select: CONTACT_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ [pluralResponseKey]: entities })
  })

  router.get('/search', async (c) => {
    const q = (c.req.query('q') || '').trim()
    const status = c.req.query('status')
    const requestedLimit = Number(c.req.query('limit') || 20)
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 20

    if (!q) {
      return c.json({ [pluralResponseKey]: [] })
    }

    const entities = await prisma[model].findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        ...(status && status !== 'all' ? { status } : {}),
      },
      select: SEARCH_SELECT,
      orderBy: { name: 'asc' },
      take: limit,
    })

    return c.json({ [pluralResponseKey]: entities })
  })

  router.post('/', async (c) => {
    const body = await c.req.json()
    const { name, phone, zipCode, street, number, complement, neighborhood, city, state, status } = body

    if (!name || !phone) {
      return c.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, 400)
    }

    const entity = await prisma[model].create({
      data: {
        name,
        phone,
        zipCode: zipCode || '',
        street: street || '',
        number: number || '',
        complement: complement || '',
        neighborhood: neighborhood || '',
        city: city || '',
        state: state || '',
        status: status || 'active',
      },
      select: CONTACT_SELECT,
    })

    return c.json({ [responseKey]: entity }, 201)
  })

  router.get('/:id', async (c) => {
    const entityId = c.req.param('id')
    const select = detailSelect ?? CONTACT_SELECT

    const entity = await prisma[model].findUnique({
      where: { id: entityId },
      select,
    })

    if (!entity) {
      return c.json({ error: `${entityName} não encontrado.` }, 404)
    }

    return c.json({ [responseKey]: entity })
  })

  router.patch('/:id', async (c) => {
    const entityId = c.req.param('id')
    const body = await c.req.json()

    const existing = await prisma[model].findUnique({ where: { id: entityId } })
    if (!existing) {
      return c.json({ error: `${entityName} não encontrado.` }, 404)
    }

    const data: Record<string, unknown> = {}
    for (const field of CONTACT_FIELDS) {
      const value = body[field]
      if (value !== undefined) {
        if (field === 'complement') {
          data[field] = value
        } else if (value) {
          data[field] = value
        }
      }
    }

    const entity = await prisma[model].update({
      where: { id: entityId },
      data,
      select: CONTACT_SELECT,
    })

    return c.json({ [responseKey]: entity })
  })

  router.patch('/:id/status', async (c) => {
    const entityId = c.req.param('id')
    const body = await c.req.json()
    const { status } = body as { status: string }

    if (!STATUS_VALUES.includes(status as typeof STATUS_VALUES[number])) {
      return c.json({ error: 'Status inválido.' }, 400)
    }

    const existing = await prisma[model].findUnique({ where: { id: entityId } })
    if (!existing) {
      return c.json({ error: `${entityName} não encontrado.` }, 404)
    }

    const entity = await prisma[model].update({
      where: { id: entityId },
      data: { status },
      select: CONTACT_SELECT,
    })

    return c.json({ [responseKey]: entity })
  })

  return router
}
