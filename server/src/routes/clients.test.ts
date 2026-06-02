import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  client: {
    findMany: vi.fn(),
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

describe('client routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caps client search limit and filters by status', async () => {
    prisma.client.findMany.mockResolvedValue([
      { id: 'client-1', name: 'Cliente', phone: '123', status: 'active' },
    ])

    const response = await app.request(
      '/api/clients/search?q=cliente&limit=500&status=active',
      { headers: authHeaders }
    )

    expect(response.status).toBe(200)
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        where: expect.objectContaining({ status: 'active' }),
      })
    )
  })

  it('requires name and phone to create clients', async () => {
    const response = await app.request('/api/clients', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Cliente' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'All required fields must be provided',
    })
    expect(prisma.client.create).not.toHaveBeenCalled()
  })

  it('updates only provided client fields', async () => {
    prisma.client.findUnique.mockResolvedValue({ id: 'client-1' })
    prisma.client.update.mockResolvedValue({
      id: 'client-1',
      name: 'Cliente Novo',
      complement: '',
    })

    const response = await app.request('/api/clients/client-1', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Cliente Novo', complement: '' }),
    })

    expect(response.status).toBe(200)
    expect(prisma.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'client-1' },
        data: { name: 'Cliente Novo', complement: '' },
      })
    )
  })

  it('blocks deleting clients with linked sales', async () => {
    prisma.client.findUnique.mockResolvedValue({
      id: 'client-1',
      _count: { sales: 1 },
    })

    const response = await app.request('/api/clients/client-1', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Não é possível excluir este cliente pois existem vendas vinculadas.',
    })
    expect(prisma.client.delete).not.toHaveBeenCalled()
  })
})
