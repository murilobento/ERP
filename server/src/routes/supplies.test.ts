import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  supply: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  stockMovement: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
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

describe('supply routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty search results without querying when q is blank', async () => {
    const response = await app.request('/api/supplies/search?q=   ', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ supplies: [] })
    expect(prisma.supply.findMany).not.toHaveBeenCalled()
  })

  it('caps search limit at 50 and can include stock', async () => {
    prisma.supply.findMany.mockResolvedValue([
      {
        id: 'supply-1',
        name: 'Farinha',
        unit: 'kg',
        status: 'active',
        packageUnit: 'saco',
        packageQuantity: 5,
        costPrice: 10,
      },
    ])
    prisma.stockMovement.groupBy.mockResolvedValue([
      { supplyId: 'supply-1', _sum: { quantity: 12 } },
    ])

    const response = await app.request(
      '/api/supplies/search?q=farinha&limit=999&includeStock=true&status=active',
      { headers: authHeaders }
    )

    expect(response.status).toBe(200)
    expect(prisma.supply.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        where: expect.objectContaining({ status: 'active' }),
      })
    )
    await expect(response.json()).resolves.toEqual({
      supplies: [
        expect.objectContaining({
          id: 'supply-1',
          stock: 12,
        }),
      ],
    })
  })

  it('creates supplies with safe defaults', async () => {
    prisma.supply.create.mockResolvedValue({
      id: 'supply-1',
      name: 'Farinha',
      description: '',
      unit: 'un',
      packageUnit: '',
      packageQuantity: 1,
      status: 'active',
    })

    const response = await app.request('/api/supplies', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Farinha' }),
    })

    expect(response.status).toBe(201)
    expect(prisma.supply.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Farinha',
          description: '',
          unit: 'un',
          packageUnit: '',
          packageQuantity: 1,
          status: 'active',
        },
      })
    )
  })

  it('blocks deleting supplies linked to compositions or purchases', async () => {
    prisma.supply.findUnique.mockResolvedValue({
      id: 'supply-1',
      _count: { compositions: 1, purchaseItems: 2 },
    })

    const response = await app.request('/api/supplies/supply-1', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('composições de produto')
    expect(prisma.supply.delete).not.toHaveBeenCalled()
  })
})
