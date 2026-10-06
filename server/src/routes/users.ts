import { Hono } from 'hono'
import type { Prisma } from '@prisma/client'
import prisma from '../lib/prisma.js'
import { hashPassword } from '../lib/auth.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole, ROLES, type Role } from '../lib/rbac.js'

const userRoutes = new Hono()

userRoutes.use('*', authMiddleware)

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

function buildChanges(
  existing: Record<string, unknown> | null,
  updates: Record<string, unknown>
): Prisma.InputJsonObject {
  const changes: Record<string, Prisma.InputJsonValue> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    const oldValue = existing ? existing[key] : null
    if (oldValue !== value) {
      if (key === 'password') {
        changes[key] = { old: '•••••••', new: '•••••••' }
      } else {
        changes[key] = {
          old: toJsonValue(oldValue),
          new: toJsonValue(value),
        }
      }
    }
  }
  return changes
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  return String(value)
}

userRoutes.get('/', requireRole('admin'), async (c) => {
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ users })
})

userRoutes.post('/', requireRole('admin'), async (c) => {
  const authorId = c.get('userId')
  const body = await c.req.json()
  const { email, password, firstName, lastName, role } = body

  if (!email || !password || !firstName || !lastName) {
    return c.json({ error: 'Todos os campos são obrigatórios.' }, 400)
  }

  if (password.length < 7) {
    return c.json({ error: 'A senha deve ter pelo menos 7 caracteres.' }, 400)
  }

  const userRole: Role = role && ROLES.includes(role) ? role : 'operator'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Email já está em uso.' }, 409)
  }

  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, role: userRole },
    select: USER_SELECT,
  })

  await prisma.auditLog.create({
    data: {
      action: 'user_created',
      authorId,
      targetUserId: user.id,
      changes: { email, firstName, lastName, role: userRole },
    },
  })

  return c.json({ user }, 201)
})

userRoutes.patch('/:id', requireRole('admin'), async (c) => {
  const authorId = c.get('userId')
  const userId = c.req.param('id')

  const body = await c.req.json()
  const { email, firstName, lastName, password, role } = body

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

  if (role && !ROLES.includes(role)) {
    return c.json({ error: 'Função inválida.' }, 400)
  }

  const data: {
    email?: string
    firstName?: string
    lastName?: string
    password?: string
    role?: Role
  } = {}
  if (email) data.email = email
  if (firstName) data.firstName = firstName
  if (lastName) data.lastName = lastName
  if (role && ROLES.includes(role)) data.role = role
  if (password) {
    if (password.length < 7) {
      return c.json({ error: 'A senha deve ter pelo menos 7 caracteres.' }, 400)
    }
    data.password = await hashPassword(password)
  }

  const changes = buildChanges(
    { email: existing.email, firstName: existing.firstName, lastName: existing.lastName, role: existing.role },
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

userRoutes.patch('/:id/status', requireRole('admin'), async (c) => {
  const authorId = c.get('userId')
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

  if (status === 'inactive' && userId === authorId) {
    return c.json({ error: 'Você não pode desativar o próprio usuário.' }, 400)
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
