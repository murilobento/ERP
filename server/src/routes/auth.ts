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

const loginAttempts = new Map<string, { count: number; expiresAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 1000

function getClientIp(c: import('hono').Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now > entry.expiresAt) {
    loginAttempts.set(ip, { count: 1, expiresAt: now + WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > MAX_ATTEMPTS
}

authRoutes.post('/sign-in', async (c) => {
  const ip = getClientIp(c)
  if (isRateLimited(ip)) {
    return c.json({ error: 'Muitas tentativas. Tente novamente em alguns segundos.' }, 429)
  }

  const body = await c.req.json()
  const { email, password } = body

  if (!email || !password) {
    return c.json({ error: 'Email e senha são obrigatórios.' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return c.json({ error: 'Credenciais inválidas.' }, 401)
  }

  if (user.status !== 'active') {
    return c.json({ error: 'Conta desativada.' }, 403)
  }

  const valid = await comparePassword(password, user.password)
  if (!valid) {
    return c.json({ error: 'Credenciais inválidas.' }, 401)
  }

  loginAttempts.delete(ip)

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
    return c.json({ error: 'Sessão expirada. Faça login novamente.' }, 401)
  }

  const payload = verifyToken(token)
  if (!payload || payload.type !== 'refresh') {
    return c.json({ error: 'Sessão expirada. Faça login novamente.' }, 401)
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    return c.json({ error: 'Usuário não encontrado.' }, 401)
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
    return c.json({ error: 'Usuário não encontrado.' }, 404)
  }

  return c.json({ user })
})

export { authRoutes }
