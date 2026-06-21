import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  vendor: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

describe('vendor routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
  })

  it('returns empty search results without querying when q is blank', async () => {
    const response = await app.request('/api/vendors/search?q=   ', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ vendors: [] })
    expect(prisma.vendor.findMany).not.toHaveBeenCalled()
  })

  it('caps vendor search limit and filters by status', async () => {
    prisma.vendor.findMany.mockResolvedValue([
      { id: 'vendor-1', name: 'Fornecedor', phone: '123', status: 'active' },
    ])

    const response = await app.request(
      '/api/vendors/search?q=fornecedor&limit=500&status=active',
      { headers: authHeaders }
    )

    expect(response.status).toBe(200)
    expect(prisma.vendor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        where: expect.objectContaining({ status: 'active' }),
      })
    )
  })

  it('requires name and phone to create vendors', async () => {
    const response = await app.request('/api/vendors', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Fornecedor' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Todos os campos obrigatórios devem ser preenchidos.',
    })
    expect(prisma.vendor.create).not.toHaveBeenCalled()
  })

  it('toggles vendor status between active and inactive', async () => {
    prisma.vendor.findUnique.mockResolvedValue({
      id: 'vendor-1',
      status: 'active',
    })
    prisma.vendor.update.mockResolvedValue({
      id: 'vendor-1',
      status: 'inactive',
    })

    const response = await app.request('/api/vendors/vendor-1/status', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'inactive' }),
    })

    expect(response.status).toBe(200)
    expect(prisma.vendor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vendor-1' },
        data: { status: 'inactive' },
      })
    )
  })
})
