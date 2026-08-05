import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const auditLogRoutes = new Hono()

auditLogRoutes.use('*', authMiddleware)

const AUDIT_LOG_SELECT = {
  id: true,
  action: true,
  authorId: true,
  targetUserId: true,
  changes: true,
  createdAt: true,
  author: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  targetUser: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
}

const ACTION_LABELS: Record<string, string> = {
  user_created: 'Usuário criado',
  user_updated: 'Usuário atualizado',
  user_activated: 'Usuário ativado',
  user_deactivated: 'Usuário desativado',
}

auditLogRoutes.get('/', async (c) => {
  const action = c.req.query('action')
  const authorId = c.req.query('authorId')

  const where: { action?: string; authorId?: string } = {}
  if (action) where.action = action
  if (authorId) where.authorId = authorId

  const logs = await prisma.auditLog.findMany({
    where,
    select: AUDIT_LOG_SELECT,
    orderBy: { createdAt: 'desc' },
  })

  const logsLabeled = logs.map((log) => ({
    ...log,
    actionLabel: ACTION_LABELS[log.action] || log.action,
  }))

  return c.json({ logs: logsLabeled })
})

export { auditLogRoutes }
