import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from './app'
import { signAccessToken, signRefreshToken } from './lib/auth'

const prisma = vi.hoisted(() => ({
  client: {
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
}))

vi.mock('./lib/prisma', () => ({
  default: prisma,
}))

const app = createApp({ enableLogger: false })

describe('api security boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows unauthenticated health checks', async () => {
    const response = await app.request('/api/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })

  it('requires an access token for protected business endpoints', async () => {
    const response = await app.request('/api/clients')

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(prisma.client.findMany).not.toHaveBeenCalled()
  })

  it('rejects refresh tokens on protected business endpoints', async () => {
    const response = await app.request('/api/clients', {
      headers: {
        Cookie: `access_token=${signRefreshToken('user-1')}`,
      },
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid token' })
    expect(prisma.client.findMany).not.toHaveBeenCalled()
  })

  it('does not select password hashes from user listings', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'admin@admin.com',
        firstName: 'Admin',
        lastName: 'Sistema',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    const response = await app.request('/api/users', {
      headers: {
        Cookie: `access_token=${signAccessToken('user-1')}`,
      },
    })

    expect(response.status).toBe(200)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ password: true }),
      })
    )
    expect(JSON.stringify(await response.json())).not.toContain('password')
  })
})
