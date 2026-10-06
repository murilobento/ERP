import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

export type ContactCreateData = {
  name: string
  phone: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  status: string
}

export type ContactUpdateData = Partial<ContactCreateData>

type ContactSearch = {
  query: string
  status?: string
  limit: number
}

type ContactOperations = {
  list: () => Promise<unknown[]>
  search: (params: ContactSearch) => Promise<unknown[]>
  create: (data: ContactCreateData) => Promise<unknown>
  getById: (id: string, details: boolean) => Promise<unknown | null>
  update: (id: string, data: ContactUpdateData) => Promise<unknown>
  updateStatus: (id: string, status: string) => Promise<unknown>
}

interface ContactRoutesConfig {
  entityName: string
  responseKey: string
  pluralResponseKey: string
  operations: ContactOperations
}

export const CONTACT_SELECT = {
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
} as const

export const SEARCH_SELECT = {
  id: true,
  name: true,
  phone: true,
  status: true,
} as const

const CONTACT_FIELDS = [
  'name',
  'phone',
  'zipCode',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
  'status',
] as const

const STATUS_VALUES = ['active', 'inactive'] as const

export function createContactRoutes(config: ContactRoutesConfig) {
  const { entityName, responseKey, pluralResponseKey, operations } = config
  const router = new Hono()

  router.use('*', authMiddleware)

  router.get('/', async (c) => {
    const entities = await operations.list()
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

    const entities = await operations.search({
      query: q,
      status: status && status !== 'all' ? status : undefined,
      limit,
    })

    return c.json({ [pluralResponseKey]: entities })
  })

  router.post('/', async (c) => {
    const body = await c.req.json()
    const {
      name,
      phone,
      zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      status,
    } = body as Partial<ContactCreateData>

    if (!name) {
      return c.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, 400)
    }

    const entity = await operations.create({
      name,
      phone: phone || '',
      zipCode: zipCode || '',
      street: street || '',
      number: number || '',
      complement: complement || '',
      neighborhood: neighborhood || '',
      city: city || '',
      state: state || '',
      status: status || 'active',
    })

    return c.json({ [responseKey]: entity }, 201)
  })

  router.get('/:id', async (c) => {
    const entityId = c.req.param('id')
    const entity = await operations.getById(entityId, true)

    if (!entity) {
      return c.json({ error: `${entityName} não encontrado.` }, 404)
    }

    return c.json({ [responseKey]: entity })
  })

  router.patch('/:id', async (c) => {
    const entityId = c.req.param('id')
    const body = await c.req.json()

    const existing = await operations.getById(entityId, false)
    if (!existing) {
      return c.json({ error: `${entityName} não encontrado.` }, 404)
    }

    const data: ContactUpdateData = {}
    for (const field of CONTACT_FIELDS) {
      const value = (body as Partial<ContactUpdateData>)[field]
      if (value !== undefined) {
        if (field === 'complement' || field === 'phone') {
          data[field] = value
        } else if (value) {
          data[field] = value
        }
      }
    }

    const entity = await operations.update(entityId, data)

    return c.json({ [responseKey]: entity })
  })

  router.patch('/:id/status', async (c) => {
    const entityId = c.req.param('id')
    const body = await c.req.json()
    const { status } = body as { status: string }

    if (!STATUS_VALUES.includes(status as typeof STATUS_VALUES[number])) {
      return c.json({ error: 'Status inválido.' }, 400)
    }

    const existing = await operations.getById(entityId, false)
    if (!existing) {
      return c.json({ error: `${entityName} não encontrado.` }, 404)
    }

    const entity = await operations.updateStatus(entityId, status)

    return c.json({ [responseKey]: entity })
  })

  return router
}
