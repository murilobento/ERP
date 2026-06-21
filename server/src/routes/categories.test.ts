import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  category: {
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

describe('category routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
  })

  it('rejects category creation without a name', async () => {
    const response = await app.request('/api/categories', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ status: 'active' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Nome é obrigatório.' })
    expect(prisma.category.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate category names on create', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'category-1' })

    const response = await app.request('/api/categories', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bolos' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Já existe uma categoria com esse nome.',
    })
    expect(prisma.category.create).not.toHaveBeenCalled()
  })

  it('creates categories with active as the default status', async () => {
    prisma.category.findUnique.mockResolvedValue(null)
    prisma.category.create.mockResolvedValue({
      id: 'category-1',
      name: 'Bolos',
      status: 'active',
    })

    const response = await app.request('/api/categories', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bolos' }),
    })

    expect(response.status).toBe(201)
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Bolos', status: 'active' },
    })
  })

  it('blocks deleting categories with linked products', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'category-1',
      _count: { products: 2 },
    })

    const response = await app.request('/api/categories/category-1', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Não é possível excluir uma categoria com produtos vinculados.',
    })
    expect(prisma.category.delete).not.toHaveBeenCalled()
  })
})
