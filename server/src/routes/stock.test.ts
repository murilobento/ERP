import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const prisma = vi.hoisted(() => ({
  product: {
    findUnique: vi.fn(),
  },
  supply: {
    findUnique: vi.fn(),
  },
  stockMovement: {
    aggregate: vi.fn(),
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
      error: 'Quantidade deve ser um número inteiro diferente de zero.',
    })
    expect(prisma.stockMovement.create).not.toHaveBeenCalled()
  })

  it('creates product adjustment movements with stock before and after values', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-1' })
    prisma.stockMovement.aggregate.mockResolvedValue({ _sum: { quantity: 7 } })
    prisma.stockMovement.create.mockResolvedValue({
      id: 'movement-1',
      productId: 'product-1',
      supplyId: null,
      quantity: 3,
      stockBefore: 7,
      stockAfter: 10,
      type: 'adjustment',
      referenceId: null,
      notes: 'Inventory count',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      author: { id: 'user-1', firstName: 'Admin', lastName: 'Sistema' },
      product: { id: 'product-1', name: 'Produto', unit: 'un' },
      supply: null,
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
    expect(prisma.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-1',
          supplyId: null,
          authorId: 'user-1',
          quantity: 3,
          stockBefore: 7,
          stockAfter: 10,
          type: 'adjustment',
          notes: 'Inventory count',
        }),
      })
    )
  })
})
