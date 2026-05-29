import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { hashPassword } from '../lib/auth'
import { authMiddleware } from '../middleware/auth'

const userRoutes = new Hono()

userRoutes.use('*', authMiddleware)

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
}

userRoutes.get('/', async (c) => {
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ users })
})

userRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { email, password, firstName, lastName } = body

  if (!email || !password || !firstName || !lastName) {
    return c.json({ error: 'All fields are required' }, 400)
  }

  if (password.length < 7) {
    return c.json({ error: 'Password must be at least 7 characters long.' }, 400)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Email already in use' }, 409)
  }

  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName },
    select: USER_SELECT,
  })

  return c.json({ user }, 201)
})

userRoutes.patch('/:id', async (c) => {
  const userId = c.req.param('id')
  const body = await c.req.json()
  const { email, firstName, lastName, password } = body

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } })
    if (emailTaken) {
      return c.json({ error: 'Email already in use' }, 409)
    }
  }

  const data: {
    email?: string
    firstName?: string
    lastName?: string
    password?: string
  } = {}
  if (email) data.email = email
  if (firstName) data.firstName = firstName
  if (lastName) data.lastName = lastName
  if (password) {
    if (password.length < 7) {
      return c.json({ error: 'Password must be at least 7 characters long.' }, 400)
    }
    data.password = await hashPassword(password)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  })

  return c.json({ user })
})

userRoutes.delete('/:id', async (c) => {
  const userId = c.req.param('id')

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return c.json({ error: 'User not found' }, 404)
  }

  await prisma.user.delete({ where: { id: userId } })
  return c.json({ ok: true })
})

export { userRoutes }
