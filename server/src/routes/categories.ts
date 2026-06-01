import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const categoryRoutes = new Hono()

categoryRoutes.use('*', authMiddleware)

categoryRoutes.get('/', async (c) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })

  return c.json({ categories })
})

categoryRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { name, status } = body

  if (!name) {
    return c.json({ error: 'Nome é obrigatório.' }, 400)
  }

  const existing = await prisma.category.findUnique({ where: { name } })
  if (existing) {
    return c.json({ error: 'Já existe uma categoria com esse nome.' }, 400)
  }

  const category = await prisma.category.create({
    data: {
      name,
      status: status || 'active',
    },
  })

  return c.json({ category }, 201)
})

categoryRoutes.get('/:id', async (c) => {
  const categoryId = c.req.param('id')

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  })

  if (!category) {
    return c.json({ error: 'Categoria não encontrada.' }, 404)
  }

  return c.json({ category })
})

categoryRoutes.patch('/:id', async (c) => {
  const categoryId = c.req.param('id')
  const body = await c.req.json()
  const { name, status } = body

  const existing = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!existing) {
    return c.json({ error: 'Categoria não encontrada.' }, 404)
  }

  if (name && name !== existing.name) {
    const duplicate = await prisma.category.findUnique({ where: { name } })
    if (duplicate) {
      return c.json({ error: 'Já existe uma categoria com esse nome.' }, 400)
    }
  }

  const data: { name?: string; status?: string } = {}
  if (name) data.name = name
  if (status) data.status = status

  const category = await prisma.category.update({
    where: { id: categoryId },
    data,
  })

  return c.json({ category })
})

categoryRoutes.delete('/:id', async (c) => {
  const categoryId = c.req.param('id')

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  })
  if (!existing) {
    return c.json({ error: 'Categoria não encontrada.' }, 404)
  }

  if (existing._count.products > 0) {
    return c.json({ error: 'Não é possível excluir uma categoria com produtos vinculados.' }, 400)
  }

  await prisma.category.delete({ where: { id: categoryId } })
  return c.json({ ok: true })
})

export { categoryRoutes }
