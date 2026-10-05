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
  company: {
    findUnique: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
  sale: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

const generateInvoicePdf = vi.hoisted(() =>
  vi.fn(() => new TextEncoder().encode('%PDF-1.3 fatura')),
);

vi.mock('../lib/invoice-pdf.js', () => ({
  generateInvoicePdf,
}))

const app = createApp({ enableLogger: false })
const authHeaders = {
  'Content-Type': 'application/json',
  Cookie: `access_token=${signAccessToken('user-1')}`,
}

const invoiceSale = {
  id: 'sale-1',
  clientId: 'client-1',
  customer: 'Cliente Uno',
  status: 'completed',
  createdAt: new Date('2026-01-05T12:00:00.000Z'),
  deliveryDate: null,
  paymentMethod: 'pix',
  paidAt: new Date('2026-01-05T15:00:00.000Z'),
  paymentNotes: '',
  notes: '',
  items: [
    {
      name: 'Bolo',
      quantity: 2,
      unitPrice: 10,
      product: { name: 'Bolo' },
    },
  ],
}

describe('sale routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', status: 'active', role: 'admin' })
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
      '2026-06-10T03:00:00.000Z'
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
          product: { id: 'product-1', name: 'Bolo' },
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
            product: { id: 'product-1', name: 'Bolo' },
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
            product: { id: 'product-1', name: 'Bolo' },
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

  it.each(['in_preparation', 'ready_for_delivery'])(
    'deletes a sale in %s',
    async (status) => {
      prisma.sale.findUnique.mockResolvedValue({ id: 'sale-1', status })

      const response = await app.request('/api/sales/sale-1', {
        method: 'DELETE',
        headers: authHeaders,
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ ok: true })
      expect(prisma.sale.delete).toHaveBeenCalledWith({ where: { id: 'sale-1' } })
    }
  )

  it.each(['delivered', 'completed'])(
    'rejects deleting a sale in %s',
    async (status) => {
      prisma.sale.findUnique.mockResolvedValue({ id: 'sale-1', status })

      const response = await app.request('/api/sales/sale-1', {
        method: 'DELETE',
        headers: authHeaders,
      })

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: 'Apenas vendas ainda não entregues podem ser excluídas.',
      })
      expect(prisma.sale.delete).not.toHaveBeenCalled()
    }
  )

  it('returns 404 when deleting a missing sale', async () => {
    prisma.sale.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/sales/missing', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Venda não encontrada.',
    })
    expect(prisma.sale.delete).not.toHaveBeenCalled()
  })

  it('generates the invoice even without a company record', async () => {
    prisma.sale.findUnique.mockResolvedValue(invoiceSale)
    prisma.client.findUnique.mockResolvedValue(null)
    prisma.company.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/sales/sale-1/invoice', {
      headers: authHeaders,
    })

expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="fatura-SALE-1.pdf"',
    )
    await expect(response.arrayBuffer()).resolves.toHaveProperty(
      'byteLength',
      15,
    )
    // Cabeçalho em branco, mas venda, cliente e itens continuam na fatura.
    expect(generateInvoicePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        company: {
          name: '',
          tradeName: '',
          cnpj: '',
          email: '',
          phone: '',
          logoUrl: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          website: '',
          whatsapp: '',
        },
        client: expect.objectContaining({ name: 'Cliente Uno' }),
        items: [{ name: 'Bolo', quantity: 2, unitPrice: 10 }],
      })
    )
  })

  it('includes the company data on the invoice when configured', async () => {
    prisma.sale.findUnique.mockResolvedValue(invoiceSale)
    prisma.client.findUnique.mockResolvedValue({
      name: 'Cliente',
      phone: '11999999999',
      street: 'Rua A',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    })
    prisma.company.findUnique.mockResolvedValue({
      name: 'Doces da Ana',
      tradeName: 'Aninha Doces',
      cnpj: '12345678000199',
      email: 'contato@doces.com.br',
      phone: '1144444444',
      logoUrl: '',
      street: 'Rua B',
      number: '20',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      website: '',
      whatsapp: '',
    })

    const response = await app.request('/api/sales/sale-1/invoice', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(generateInvoicePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({
          name: 'Doces da Ana',
          tradeName: 'Aninha Doces',
          cnpj: '12345678000199',
          city: 'São Paulo',
        }),
        client: expect.objectContaining({ name: 'Cliente', state: 'SP' }),
      })
    )
  })

  it('returns 404 when generating the invoice of a missing sale', async () => {
    prisma.sale.findUnique.mockResolvedValue(null)

    const response = await app.request('/api/sales/missing/invoice', {
      headers: authHeaders,
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Venda não encontrada.',
    })
    expect(generateInvoicePdf).not.toHaveBeenCalled()
  })

  it('blocks operators from deleting sales', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: 'active',
      role: 'operator',
    })

    const response = await app.request('/api/sales/sale-1', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Acesso negado.' })
    expect(prisma.sale.findUnique).not.toHaveBeenCalled()
  })
})
