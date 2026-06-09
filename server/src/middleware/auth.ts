import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import prisma from '../lib/prisma'
import { verifyToken } from '../lib/auth'

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'access_token')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(token)
  if (!payload || payload.type !== 'access') {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, status: true },
  })

  if (!user || user.status !== 'active') {
    return c.json({ error: 'Conta desativada.' }, 403)
  }

  c.set('userId', payload.sub)
  await next()
}
