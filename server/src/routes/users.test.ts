import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { comparePassword, signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2' })

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
    await expect(response.json()).resolves.toEqual({ error: 'Email already in use' })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('hashes user passwords and never selects password in the response', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'Sistema',
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

  it('rejects deleting missing users', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/users/missing-user', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'User not found' })
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })
})
