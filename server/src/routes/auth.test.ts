import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { hashPassword, signRefreshToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('../lib/prisma', () => ({
  default: prisma,
}))

const app = createApp({ enableLogger: false })

const jsonHeaders = { 'Content-Type': 'application/json' }

const user = {
  id: 'user-1',
  email: 'admin@admin.com',
  firstName: 'Admin',
  lastName: 'Sistema',
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects missing credentials', async () => {
    const response = await app.request('/api/auth/sign-in', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: 'admin@admin.com' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Email e senha são obrigatórios.',
    })
  })

  it('uses a generic error for unknown users', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/auth/sign-in', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        email: 'missing@example.com',
        password: 'wrong-password',
      }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Credenciais inválidas.',
    })
  })

  it('sets httpOnly scoped auth cookies and does not return password data', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      password: await hashPassword('admin123'),
    })

    const response = await app.request('/api/auth/sign-in', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        email: user.email,
        password: 'admin123',
      }),
    })

    const body = await response.json()
    const setCookie = response.headers.get('set-cookie') ?? ''

    expect(response.status).toBe(200)
    expect(body).toEqual({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
      },
    })
    expect(JSON.stringify(body)).not.toContain('password')
    expect(setCookie).toContain('access_token=')
    expect(setCookie).toContain('refresh_token=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toContain('Path=/api')
    expect(setCookie).toContain('Path=/api/auth/refresh')
  })

  it('rotates tokens with a valid refresh cookie', async () => {
    prisma.user.findUnique.mockResolvedValue(user)

    const response = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `refresh_token=${signRefreshToken(user.id)}`,
      },
    })

    const setCookie = response.headers.get('set-cookie') ?? ''

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(setCookie).toContain('access_token=')
    expect(setCookie).toContain('refresh_token=')
  })

  it('rejects invalid refresh cookies', async () => {
    const response = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: 'refresh_token=invalid-token',
      },
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Sessão expirada. Faça login novamente.',
    })
  })
})
