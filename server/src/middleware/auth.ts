import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
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

  c.set('userId', payload.sub)
  await next()
}
