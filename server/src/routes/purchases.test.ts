import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const tx = vi.hoisted(() => ({
  purchase: {
    update: vi.fn(),
  },
  stockMovement: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    create: vi.fn(),
  },
  supply: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  purchaseItem: {
    findMany: vi.fn(),
  },
}))

const prisma = vi.hoisted(() => ({
  purchase: {
    findUnique: vi.fn(),
  },
  user: {
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

const supply = {
  id: 'supply-1',
  name: 'Farinha',
  unit: 'kg',
  packageUnit: 'saco',
  packageQuantity: 5,
}

const completedPurchase = {
  id: 'purchase-1',
  supplier: 'Fornecedor',
  status: 'completed',
  items: [
    {
      id: 'item-1',
      supplyId: supply.id,
      packages: 2,
      quantity: 10,
      packageCost: 50,
      supply,
    },
  ],
}

describe('purchase routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.stockMovement.groupBy.mockResolvedValue([
      { supplyId: 'supply-1', _sum: { quantity: 20 } },
    ])
    tx.supply.findUnique.mockResolvedValue(supply)
    tx.purchaseItem.findMany.mockResolvedValue([
      { packageCost: 50 },
      { packageCost: 55 },
      { packageCost: 60 },
    ])
  })

  it('rejects completing purchases that are not pending', async () => {
    prisma.purchase.findUnique.mockResolvedValue(completedPurchase)

    const response = await app.request('/api/purchases/purchase-1/complete', {
      method: 'POST',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Apenas compras pendentes podem ser concluídas.',
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('completes a pending purchase and creates supply stock movements', async () => {
    prisma.purchase.findUnique
      .mockResolvedValueOnce({ ...completedPurchase, status: 'pending' })
      .mockResolvedValueOnce({ id: 'purchase-1', status: 'completed' })

    const response = await app.request('/api/purchases/purchase-1/complete', {
      method: 'POST',
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(tx.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'purchase-1' },
        data: expect.objectContaining({
          status: 'completed',
          reversalReason: '',
          reversedBy: null,
          reversedAt: null,
          completedAt: expect.any(Date),
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplyId: 'supply-1',
          authorId: 'user-1',
          quantity: 10,
          stockBefore: 20,
          stockAfter: 30,
          type: 'purchase',
          referenceId: 'purchase-1',
        }),
      })
    )
    expect(tx.supply.update).toHaveBeenCalledWith({
      where: { id: 'supply-1' },
      data: { costPrice: 11 },
    })
  })

  it('requires a reversal reason before reversing completed purchases', async () => {
    const response = await app.request('/api/purchases/purchase-1/reverse', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: '  ' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Motivo do estorno é obrigatório.',
    })
    expect(prisma.purchase.findUnique).not.toHaveBeenCalled()
  })

  it('reverses completed purchases with negative stock movements', async () => {
    prisma.purchase.findUnique
      .mockResolvedValueOnce(completedPurchase)
      .mockResolvedValueOnce({ id: 'purchase-1', status: 'pending' })
    prisma.user.findUnique.mockResolvedValue({
      firstName: 'Admin',
      lastName: 'Sistema',
    })

    const response = await app.request('/api/purchases/purchase-1/reverse', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Ajuste fiscal' }),
    })

    expect(response.status).toBe(200)
    expect(tx.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'purchase-1' },
        data: expect.objectContaining({
          status: 'pending',
          reversalReason: 'Ajuste fiscal',
          reversedBy: 'user-1',
          completedAt: null,
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplyId: 'supply-1',
          authorId: 'user-1',
          quantity: -10,
          stockBefore: 20,
          stockAfter: 10,
          type: 'purchase_reversal',
          referenceId: 'purchase-1',
        }),
      })
    )
  })
})
