import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const tx = vi.hoisted(() => ({
  production: {
    update: vi.fn(),
  },
  stockMovement: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    create: vi.fn(),
  },
}))

const prisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  production: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) =>
    callback(tx)
  ),
}))

vi.mock('../lib/prisma', () => ({
  default: prisma,
}))

const app = createApp({ enableLogger: false })
const authHeaders = {
  'Content-Type': 'application/json',
  Cookie: `access_token=${signAccessToken('user-1')}`,
}

const product = {
  id: 'product-1',
  name: 'Bolo',
  unit: 'un',
  composition: [
    {
      id: 'composition-1',
      supplyId: 'supply-1',
      quantity: 2,
      supply: { id: 'supply-1', name: 'Farinha', unit: 'kg' },
    },
    {
      id: 'composition-2',
      supplyId: 'supply-2',
      quantity: 1,
      supply: { id: 'supply-2', name: 'Açúcar', unit: 'kg' },
    },
  ],
}

const production = {
  id: 'production-1',
  productId: product.id,
  quantity: 3,
  status: 'in_production',
  product,
  items: [
    {
      id: 'production-item-1',
      productionId: 'production-1',
      productId: product.id,
      quantity: 3,
      product,
    },
  ],
}

describe('production routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
    tx.stockMovement.groupBy.mockImplementation(async (args) => {
      if (args.by.includes('productId')) {
        return [{ productId: 'product-1', _sum: { quantity: 5 } }]
      }

      return [
        { supplyId: 'supply-1', _sum: { quantity: 20 } },
        { supplyId: 'supply-2', _sum: { quantity: 10 } },
      ]
    })
  })

  it('rejects completing productions that are not in production', async () => {
    prisma.production.findUnique.mockResolvedValue({
      ...production,
      status: 'completed',
    })

    const response = await app.request('/api/productions/production-1/complete', {
      method: 'POST',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Apenas produções em andamento podem ser concluídas.',
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('completes production with output and consumption stock movements', async () => {
    prisma.production.findUnique
      .mockResolvedValueOnce(production)
      .mockResolvedValueOnce({ id: 'production-1', status: 'completed' })

    const response = await app.request('/api/productions/production-1/complete', {
      method: 'POST',
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(tx.production.update).toHaveBeenCalledWith({
      where: { id: 'production-1' },
      data: { status: 'completed', completedAt: expect.any(Date) },
    })
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-1',
          authorId: 'user-1',
          quantity: 3,
          stockBefore: 5,
          stockAfter: 8,
          type: 'production_output',
          referenceId: 'production-1',
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplyId: 'supply-1',
          quantity: -6,
          stockBefore: 20,
          stockAfter: 14,
          type: 'production_consumption',
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplyId: 'supply-2',
          quantity: -3,
          stockBefore: 10,
          stockAfter: 7,
          type: 'production_consumption',
        }),
      })
    )
  })

  it('requires a reversal reason before reversing completed productions', async () => {
    const response = await app.request('/api/productions/production-1/reverse', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: '' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Motivo do estorno é obrigatório.',
    })
    expect(prisma.production.findUnique).not.toHaveBeenCalled()
  })

  it('reverses completed production by removing output and returning supplies', async () => {
    prisma.production.findUnique
      .mockResolvedValueOnce({ ...production, status: 'completed' })
      .mockResolvedValueOnce({ id: 'production-1', status: 'in_production' })

    const response = await app.request('/api/productions/production-1/reverse', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Erro operacional' }),
    })

    expect(response.status).toBe(200)
    expect(tx.production.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'production-1' },
        data: expect.objectContaining({
          status: 'in_production',
          completedAt: null,
          reversalReason: 'Erro operacional',
          reversedBy: 'user-1',
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-1',
          quantity: -3,
          type: 'production_reversal',
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplyId: 'supply-1',
          quantity: 6,
          type: 'production_reversal',
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplyId: 'supply-2',
          quantity: 3,
          type: 'production_reversal',
        }),
      })
    )
  })
})
