import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const supplyRoutes = new Hono()

supplyRoutes.use('*', authMiddleware)

const SUPPLY_SELECT = {
  id: true,
  name: true,
  description: true,
  unit: true,
  packageUnit: true,
  packageQuantity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

supplyRoutes.get('/', async (c) => {
  const supplies = await prisma.supply.findMany({
    select: SUPPLY_SELECT,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ supplies })
})

supplyRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, description, unit, packageUnit, packageQuantity, status } = body

  if (!name) {
    return c.json({ error: 'Nome é obrigatório.' }, 400)
  }

  const supply = await prisma.supply.create({
    data: {
      name,
      description: description || '',
      unit: unit || 'un',
      packageUnit: packageUnit || '',
      packageQuantity: packageQuantity || 1,
      status: status || 'active',
    },
    select: SUPPLY_SELECT,
  })

  return c.json({ supply }, 201)
})

supplyRoutes.get('/:id', async (c) => {
  const supplyId = c.req.param('id')

  const supply = await prisma.supply.findUnique({
    where: { id: supplyId },
    select: SUPPLY_SELECT,
  })

  if (!supply) {
    return c.json({ error: 'Insumo não encontrado.' }, 404)
  }

  const stockResult = await prisma.stockMovement.aggregate({
    where: { supplyId },
    _sum: { quantity: true },
  })

  return c.json({
    supply,
    stock: stockResult._sum.quantity || 0,
  })
})

supplyRoutes.patch('/:id', async (c) => {
  const supplyId = c.req.param('id')
  const body = await c.req.json()
  const { name, description, unit, packageUnit, packageQuantity, status } = body

  const existing = await prisma.supply.findUnique({ where: { id: supplyId } })
  if (!existing) {
    return c.json({ error: 'Insumo não encontrado.' }, 404)
  }

  const data: {
    name?: string
    description?: string
    unit?: string
    packageUnit?: string
    packageQuantity?: number
    status?: string
  } = {}
  if (name) data.name = name
  if (description !== undefined) data.description = description
  if (unit) data.unit = unit
  if (packageUnit !== undefined) data.packageUnit = packageUnit
  if (packageQuantity !== undefined) data.packageQuantity = packageQuantity
  if (status) data.status = status

  const supply = await prisma.supply.update({
    where: { id: supplyId },
    data,
    select: SUPPLY_SELECT,
  })

  return c.json({ supply })
})

supplyRoutes.delete('/:id', async (c) => {
  const supplyId = c.req.param('id')

  const existing = await prisma.supply.findUnique({ where: { id: supplyId } })
  if (!existing) {
    return c.json({ error: 'Insumo não encontrado.' }, 404)
  }

  await prisma.supply.delete({ where: { id: supplyId } })
  return c.json({ ok: true })
})

export { supplyRoutes }
