import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import prisma from '../lib/prisma'
import {
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../lib/auth'
import { authMiddleware } from '../middleware/auth'

const authRoutes = new Hono()

const isProd = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
}

authRoutes.post('/sign-in', async (c) => {
  const body = await c.req.json()
  const { email, password } = body

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await comparePassword(password, user.password)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const accessToken = signAccessToken(user.id)
  const refreshToken = signRefreshToken(user.id)

  setCookie(c, 'access_token', accessToken, {
    ...COOKIE_OPTIONS,
    path: '/api',
    maxAge: 15 * 60,
  })
  setCookie(c, 'refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  })

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
  })
})

authRoutes.post('/refresh', async (c) => {
  const token = getCookie(c, 'refresh_token')

  if (!token) {
    return c.json({ error: 'No refresh token' }, 401)
  }

  const payload = verifyToken(token)
  if (!payload || payload.type !== 'refresh') {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    return c.json({ error: 'User not found' }, 401)
  }

  const accessToken = signAccessToken(user.id)
  const newRefreshToken = signRefreshToken(user.id)

  setCookie(c, 'access_token', accessToken, {
    ...COOKIE_OPTIONS,
    path: '/api',
    maxAge: 15 * 60,
  })
  setCookie(c, 'refresh_token', newRefreshToken, {
    ...COOKIE_OPTIONS,
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  })

  return c.json({ ok: true })
})

authRoutes.post('/logout', async (c) => {
  setCookie(c, 'access_token', '', {
    ...COOKIE_OPTIONS,
    path: '/api',
    maxAge: 0,
  })
  setCookie(c, 'refresh_token', '', {
    ...COOKIE_OPTIONS,
    path: '/api/auth/refresh',
    maxAge: 0,
  })

  return c.json({ ok: true })
})

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

export { authRoutes }
