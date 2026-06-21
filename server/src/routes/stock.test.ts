import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  product: {
    findUnique: vi.fn(),
  },
  supply: {
    findUnique: vi.fn(),
  },
  stockMovement: {
    aggregate: vi.fn(),
  },
  stockAdjustment: {
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

describe('stock routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
  })

  it('rejects invalid stock adjustment quantities before writing movements', async () => {
    const response = await app.request('/api/stock/adjustments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        itemType: 'product',
        itemId: 'product-1',
        quantity: 0,
        reason: 'Inventory count',
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Quantidade deve ser diferente de zero.',
    })
    expect(prisma.stockAdjustment.create).not.toHaveBeenCalled()
  })

  it('creates product adjustment movements with stock before and after values', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-1' })
    prisma.stockMovement.aggregate.mockResolvedValue({ _sum: { quantity: 7 } })
    prisma.stockAdjustment.create.mockResolvedValue({
      id: 'adj-1',
      status: 'completed',
      itemType: 'product',
      productId: 'product-1',
      supplyId: null,
      quantity: 3,
      reason: 'Inventory count',
      authorId: 'user-1',
      completedById: 'user-1',
      completedAt: new Date('2026-01-01T00:00:00.000Z'),
      reversedById: null,
      reversedAt: null,
      reversalReason: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      product: { id: 'product-1', name: 'Produto', unit: 'un' },
      supply: null,
      author: { id: 'user-1', firstName: 'Admin', lastName: 'Sistema' },
      completedBy: { id: 'user-1', firstName: 'Admin', lastName: 'Sistema' },
      reversedBy: null,
    })

    const response = await app.request('/api/stock/adjustments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        itemType: 'product',
        itemId: 'product-1',
        quantity: 3,
        reason: ' Inventory count ',
      }),
    })

    expect(response.status).toBe(201)
    expect(prisma.stockAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itemType: 'product',
          productId: 'product-1',
          supplyId: null,
          authorId: 'user-1',
          quantity: 3,
          reason: 'Inventory count',
        }),
      })
    )
  })
})
