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
  status: true,
  createdAt: true,
  updatedAt: true,
}

function buildChanges(
  existing: Record<string, unknown> | null,
  updates: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    const oldValue = existing ? existing[key] : null
    if (oldValue !== value) {
      if (key === 'password') {
        changes[key] = { old: '•••••••', new: '•••••••' }
      } else {
        changes[key] = { old: oldValue, new: value }
      }
    }
  }
  return changes
}

userRoutes.get('/', async (c) => {
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ users })
})

userRoutes.post('/', async (c) => {
  const authorId = c.get('userId') as string
  const body = await c.req.json()
  const { email, password, firstName, lastName } = body

  if (!email || !password || !firstName || !lastName) {
    return c.json({ error: 'Todos os campos são obrigatórios.' }, 400)
  }

  if (password.length < 7) {
    return c.json({ error: 'A senha deve ter pelo menos 7 caracteres.' }, 400)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Email já está em uso.' }, 409)
  }

  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName },
    select: USER_SELECT,
  })

  await prisma.auditLog.create({
    data: {
      action: 'user_created',
      authorId,
      targetUserId: user.id,
      changes: { email, firstName, lastName },
    },
  })

  return c.json({ user }, 201)
})

userRoutes.patch('/:id', async (c) => {
  const authorId = c.get('userId') as string
  const userId = c.req.param('id')

  const body = await c.req.json()
  const { email, firstName, lastName, password } = body

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return c.json({ error: 'Usuário não encontrado.' }, 404)
  }

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } })
    if (emailTaken) {
      return c.json({ error: 'Email já está em uso.' }, 409)
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
      return c.json({ error: 'A senha deve ter pelo menos 7 caracteres.' }, 400)
    }
    data.password = await hashPassword(password)
  }

  const changes = buildChanges(
    { email: existing.email, firstName: existing.firstName, lastName: existing.lastName },
    data
  )

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  })

  if (Object.keys(changes).length > 0) {
    await prisma.auditLog.create({
      data: {
        action: 'user_updated',
        authorId,
        targetUserId: userId,
        changes,
      },
    })
  }

  return c.json({ user })
})

userRoutes.patch('/:id/status', async (c) => {
  const authorId = c.get('userId') as string
  const userId = c.req.param('id')
  const body = await c.req.json()
  const { status } = body as { status: string }

  if (status !== 'active' && status !== 'inactive') {
    return c.json({ error: 'Status inválido.' }, 400)
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return c.json({ error: 'Usuário não encontrado.' }, 404)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: USER_SELECT,
  })

  await prisma.auditLog.create({
    data: {
      action: status === 'active' ? 'user_activated' : 'user_deactivated',
      authorId,
      targetUserId: userId,
      changes: { status: { old: existing.status, new: status } },
    },
  })

  return c.json({ user })
})

export { userRoutes }
