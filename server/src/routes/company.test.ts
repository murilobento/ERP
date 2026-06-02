import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  company: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
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

describe('company routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the singleton company record', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      name: 'Minha Empresa',
    })

    const response = await app.request('/api/company', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(prisma.company.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { singletonKey: 'default' } })
    )
    await expect(response.json()).resolves.toEqual({
      company: { id: 'company-1', name: 'Minha Empresa' },
    })
  })

  it('requires company name on upsert', async () => {
    const response = await app.request('/api/company', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ name: '   ' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Nome da empresa é obrigatório.',
    })
    expect(prisma.company.upsert).not.toHaveBeenCalled()
  })

  it('trims company fields before upsert', async () => {
    prisma.company.upsert.mockResolvedValue({
      id: 'company-1',
      name: 'Minha Empresa',
      email: 'admin@example.com',
    })

    const response = await app.request('/api/company', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: ' Minha Empresa ',
        email: ' admin@example.com ',
        phone: ' 123 ',
      }),
    })

    expect(response.status).toBe(200)
    expect(prisma.company.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { singletonKey: 'default' },
        create: expect.objectContaining({
          singletonKey: 'default',
          name: 'Minha Empresa',
          email: 'admin@example.com',
          phone: '123',
        }),
        update: expect.objectContaining({
          name: 'Minha Empresa',
          email: 'admin@example.com',
          phone: '123',
        }),
      })
    )
  })
})
