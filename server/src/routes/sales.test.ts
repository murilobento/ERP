import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const tx = vi.hoisted(() => ({
  sale: {
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
  client: {
    findUnique: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
  sale: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  stockMovement: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
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

describe('sale routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active' })
  })

  it('rejects sales without a delivery date', async () => {
    const response = await app.request('/api/sales', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: 'client-1',
        items: [{ productId: 'product-1', quantity: 1, unitPrice: 10 }],
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Data de entrega é obrigatória.',
    })
    expect(prisma.sale.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate products in the same sale', async () => {
    prisma.client.findUnique.mockResolvedValue({
      id: 'client-1',
      name: 'Cliente',
      status: 'active',
    })

    const response = await app.request('/api/sales', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: 'client-1',
        deliveryDate: '2026-06-10',
        items: [
          { productId: 'product-1', quantity: 1, unitPrice: 10 },
          { productId: 'product-1', quantity: 2, unitPrice: 10 },
        ],
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Não é permitido repetir o mesmo produto na venda (mesmo kit).',
    })
    expect(prisma.product.findMany).not.toHaveBeenCalled()
    expect(prisma.sale.create).not.toHaveBeenCalled()
  })

  it('creates a valid sale for an active client and active products', async () => {
    prisma.client.findUnique.mockResolvedValue({
      id: 'client-1',
      name: 'Cliente',
      status: 'active',
    })
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1', status: 'active' }])
    prisma.sale.create.mockResolvedValue({
      id: 'sale-1',
      clientId: 'client-1',
      customer: 'Cliente',
      status: 'in_preparation',
      notes: '',
      deliveryDate: new Date('2026-06-10T00:00:00.000Z'),
      items: [{ id: 'item-1', productId: 'product-1', quantity: 2, unitPrice: 15 }],
    })

    const response = await app.request('/api/sales', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: 'client-1',
        deliveryDate: '2026-06-10',
        items: [{ productId: 'product-1', quantity: 2, unitPrice: 15 }],
      }),
    })

    expect(response.status).toBe(201)
    const createArg = prisma.sale.create.mock.calls[0][0]

    expect(createArg.data).toMatchObject({
      clientId: 'client-1',
      customer: 'Cliente',
      status: 'in_preparation',
      items: {
        createMany: {
          data: [{ productId: 'product-1', quantity: 2, unitPrice: 15 }],
        },
      },
    })
    expect(createArg.data.deliveryDate).toBeInstanceOf(Date)
    expect(createArg.data.deliveryDate.toISOString()).toBe(
      new Date('2026-06-10T00:00:00').toISOString()
    )
  })

  it('blocks delivery when product stock is insufficient', async () => {
    prisma.sale.findUnique.mockResolvedValue({
      id: 'sale-1',
      customer: 'Cliente',
      status: 'ready_for_delivery',
      items: [
        {
          productId: 'product-1',
          quantity: 5,
          product: { id: 'product-1', name: 'Bolo', unit: 'un' },
        },
      ],
    })
    tx.stockMovement.groupBy.mockResolvedValue([
      { productId: 'product-1', _sum: { quantity: 2 } },
    ])

    const response = await app.request('/api/sales/sale-1/deliver', {
      method: 'POST',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('Estoque insuficiente')
    expect(tx.stockMovement.create).not.toHaveBeenCalled()
  })

  it('delivers a ready sale and creates negative stock movements', async () => {
    prisma.sale.findUnique
      .mockResolvedValueOnce({
        id: 'sale-1',
        customer: 'Cliente',
        status: 'ready_for_delivery',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            product: { id: 'product-1', name: 'Bolo', unit: 'un' },
          },
        ],
      })
      .mockResolvedValueOnce({ id: 'sale-1', status: 'delivered' })
    prisma.stockMovement.groupBy.mockResolvedValue([
      { productId: 'product-1', _sum: { quantity: 10 } },
    ])
    tx.stockMovement.groupBy.mockResolvedValue([
      { productId: 'product-1', _sum: { quantity: 10 } },
    ])

    const response = await app.request('/api/sales/sale-1/deliver', {
      method: 'POST',
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(tx.sale.update).toHaveBeenCalledWith({
      where: { id: 'sale-1' },
      data: { status: 'delivered', deliveredAt: expect.any(Date) },
    })
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-1',
          authorId: 'user-1',
          quantity: -2,
          stockBefore: 10,
          stockAfter: 8,
          type: 'sale_delivery',
          referenceId: 'sale-1',
        }),
      })
    )
  })

  it('requires payment method and date to complete sales', async () => {
    const missingMethod = await app.request('/api/sales/sale-1/complete', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ paidAt: '2026-06-10' }),
    })
    const missingPaidAt = await app.request('/api/sales/sale-1/complete', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ paymentMethod: 'Pix' }),
    })

    expect(missingMethod.status).toBe(400)
    expect(missingPaidAt.status).toBe(400)
    expect(prisma.sale.update).not.toHaveBeenCalled()
  })

  it('completes delivered sales with trimmed payment data', async () => {
    prisma.sale.findUnique.mockResolvedValue({ id: 'sale-1', status: 'delivered' })
    prisma.sale.update.mockResolvedValue({ id: 'sale-1', status: 'completed' })

    const response = await app.request('/api/sales/sale-1/complete', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        paymentMethod: ' Pix ',
        paidAt: '2026-06-10T12:00:00.000Z',
        paymentNotes: ' Pago ',
      }),
    })

    expect(response.status).toBe(200)
    expect(prisma.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sale-1' },
        data: expect.objectContaining({
          status: 'completed',
          paymentMethod: 'Pix',
          paidAt: new Date('2026-06-10T12:00:00.000Z'),
          paymentNotes: 'Pago',
        }),
      })
    )
  })

  it('reverses completed sales and returns product stock', async () => {
    prisma.sale.findUnique
      .mockResolvedValueOnce({
        id: 'sale-1',
        customer: 'Cliente',
        status: 'completed',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            product: { id: 'product-1', name: 'Bolo', unit: 'un' },
          },
        ],
      })
      .mockResolvedValueOnce({ id: 'sale-1', status: 'in_preparation' })
    tx.stockMovement.groupBy.mockResolvedValue([
      { productId: 'product-1', _sum: { quantity: 8 } },
    ])

    const response = await app.request('/api/sales/sale-1/reverse', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Erro de pagamento' }),
    })

    expect(response.status).toBe(200)
    expect(tx.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sale-1' },
        data: expect.objectContaining({
          status: 'in_preparation',
          deliveredAt: null,
          completedAt: null,
          paymentMethod: '',
          paidAt: null,
          reversalReason: 'Erro de pagamento',
          reversedBy: 'user-1',
        }),
      })
    )
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-1',
          quantity: 2,
          stockBefore: 8,
          stockAfter: 10,
          type: 'sale_reversal',
        }),
      })
    )
  })
})
