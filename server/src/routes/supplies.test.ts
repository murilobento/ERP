import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
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
  purchaseItem: {
    findMany: vi.fn(),
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
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
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

  it('returns purchase history with a summary of completed purchases only', async () => {
    prisma.supply.findUnique.mockResolvedValue({
      id: 'supply-1',
      name: 'Farinha',
      description: '',
      unit: 'kg',
      packageUnit: 'saco',
      packageQuantity: 5,
      costPrice: 2.1,
      status: 'active',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    })
    prisma.purchaseItem.findMany.mockResolvedValue([
      {
        packages: 3,
        quantity: 15,
        packageCost: 10.5,
        purchase: {
          id: 'purchase-1',
          supplier: 'Fornecedor Bom',
          status: 'completed',
          createdAt: new Date('2026-01-02'),
          completedAt: new Date('2026-01-03'),
        },
      },
      {
        packages: 2,
        quantity: 10,
        packageCost: 12,
        purchase: {
          id: 'purchase-2',
          supplier: 'Outro Fornecedor',
          status: 'pending',
          createdAt: new Date('2026-01-05'),
          completedAt: null,
        },
      },
    ])

    const response = await app.request('/api/supplies/supply-1/purchases', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(prisma.purchaseItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { supplyId: 'supply-1' } })
    )

    const body = await response.json()
    expect(body.supply).toMatchObject({ id: 'supply-1', packageQuantity: 5 })
    expect(body.purchases).toHaveLength(2)
    expect(body.purchases[0]).toMatchObject({
      id: 'purchase-1',
      packages: 3,
      quantity: 15,
      unitPrice: 2.1,
      total: 31.5,
    })
    expect(body.purchases[1]).toMatchObject({
      id: 'purchase-2',
      status: 'pending',
      unitPrice: 2.4,
      total: 24,
    })
    expect(body.summary).toEqual({
      count: 1,
      totalSpent: 31.5,
      avgUnitPrice: 2.1,
    })
  })

  it('returns 404 when the supply does not exist', async () => {
    prisma.supply.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/supplies/missing/purchases', {
      headers: authHeaders,
    })

    expect(response.status).toBe(404)
    expect(prisma.purchaseItem.findMany).not.toHaveBeenCalled()
  })
})
