import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { comparePassword, signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}))

vi.mock('../lib/prisma', () => ({
  default: prisma,
}))

const app = createApp({ enableLogger: false })
const authHeaders = {
  'Content-Type': 'application/json',
  Cookie: `access_token=${signAccessToken('user-1')}`,
}

describe('user routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
  })

  it('requires all fields and a minimum password length on create', async () => {
    const missingFields = await app.request('/api/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ email: 'admin@example.com' }),
    })
    const shortPassword = await app.request('/api/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email: 'admin@example.com',
        password: '123',
        firstName: 'Admin',
        lastName: 'Sistema',
      }),
    })

    expect(missingFields.status).toBe(400)
    expect(shortPassword.status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate emails on create', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', status: 'active', role: 'admin' })

    const response = await app.request('/api/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Sistema',
      }),
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'Email já está em uso.' })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('hashes user passwords and never selects password in the response', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'user-1', status: 'active', role: 'admin' })
      .mockResolvedValueOnce(null)
    prisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'Sistema',
      status: 'active',
    })

    const response = await app.request('/api/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Sistema',
      }),
    })

    const createArg = prisma.user.create.mock.calls[0][0]

    expect(response.status).toBe(201)
    expect(createArg.select).not.toHaveProperty('password')
    await expect(comparePassword('admin123', createArg.data.password)).resolves.toBe(
      true
    )
    expect(JSON.stringify(await response.json())).not.toContain('password')
  })

  it('toggles user status between active and inactive', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', status: 'active', role: 'admin' })
    prisma.user.update.mockResolvedValue({
      id: 'user-2',
      status: 'inactive',
    })

    const response = await app.request('/api/users/user-2/status', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'inactive' }),
    })

    expect(response.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-2' },
        data: { status: 'inactive' },
      })
    )
    expect(prisma.auditLog.create).toHaveBeenCalled()
  })

  it('rejects invalid status values', async () => {
    const response = await app.request('/api/users/user-2/status', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'banned' }),
    })

    expect(response.status).toBe(400)
  })

  it('prevents an admin from deactivating their own user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })

    const response = await app.request('/api/users/user-1/status', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'inactive' }),
    })

    expect(response.status).toBe(400)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
