import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const companyRoutes = new Hono()

companyRoutes.use('*', authMiddleware)

const COMPANY_SELECT = {
  id: true,
  name: true,
  tradeName: true,
  cnpj: true,
  email: true,
  phone: true,
  logoUrl: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  website: true,
  instagram: true,
  facebook: true,
  linkedin: true,
  whatsapp: true,
  createdAt: true,
  updatedAt: true,
}

type CompanyBody = {
  name?: string
  tradeName?: string
  cnpj?: string
  email?: string
  phone?: string
  logoUrl?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  website?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  whatsapp?: string
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

companyRoutes.get('/', async (c) => {
  const company = await prisma.company.findUnique({
    where: { singletonKey: 'default' },
    select: COMPANY_SELECT,
  })

  return c.json({ company })
})

companyRoutes.put('/', async (c) => {
  const body = (await c.req.json()) as CompanyBody
  const name = clean(body.name)

  if (!name) {
    return c.json({ error: 'Nome da empresa é obrigatório.' }, 400)
  }

  const data = {
    name,
    tradeName: clean(body.tradeName),
    cnpj: clean(body.cnpj),
    email: clean(body.email),
    phone: clean(body.phone),
    logoUrl: clean(body.logoUrl),
    zipCode: clean(body.zipCode),
    street: clean(body.street),
    number: clean(body.number),
    complement: clean(body.complement),
    neighborhood: clean(body.neighborhood),
    city: clean(body.city),
    state: clean(body.state),
    website: clean(body.website),
    instagram: clean(body.instagram),
    facebook: clean(body.facebook),
    linkedin: clean(body.linkedin),
    whatsapp: clean(body.whatsapp),
  }

  const company = await prisma.company.upsert({
    where: { singletonKey: 'default' },
    create: {
      singletonKey: 'default',
      ...data,
    },
    update: data,
    select: COMPANY_SELECT,
  })

  return c.json({ company })
})

export { companyRoutes }
