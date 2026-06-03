import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { signAccessToken } from '../lib/auth'

const tx = vi.hoisted(() => ({
  productComposition: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
}))

const prisma = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  productComposition: {
    findMany: vi.fn(),
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

describe('product routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns product list with stock and computed prices', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product-1',
        name: 'Bolo',
        margin: 50,
        composition: [
          { quantity: 2, supply: { costPrice: 10 } },
          { quantity: 1, supply: { costPrice: 5 } },
        ],
      },
    ])
    prisma.stockMovement.groupBy.mockResolvedValue([
      { productId: 'product-1', _sum: { quantity: 4 } },
    ])

    const response = await app.request('/api/products', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      products: [
        expect.objectContaining({
          id: 'product-1',
          stock: 4,
          costPrice: 25,
          salePrice: 37.5,
        }),
      ],
    })
  })

  it('requires name and category to create products', async () => {
    const missingName = await app.request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ categoryId: 'category-1' }),
    })
    const missingCategory = await app.request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bolo' }),
    })

    expect(missingName.status).toBe(400)
    await expect(missingName.json()).resolves.toEqual({ error: 'Nome é obrigatório.' })
    expect(missingCategory.status).toBe(400)
    await expect(missingCategory.json()).resolves.toEqual({
      error: 'Categoria é obrigatória.',
    })
    expect(prisma.product.create).not.toHaveBeenCalled()
  })

  it('caps product search limit and avoids stock lookup when not requested', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 'product-1', name: 'Bolo', unit: 'un', margin: 20, status: 'active' },
    ])

    const response = await app.request('/api/products/search?q=bolo&limit=500', {
      headers: authHeaders,
    })

    expect(response.status).toBe(200)
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    )
    expect(prisma.stockMovement.aggregate).not.toHaveBeenCalled()
  })

  it('replaces product composition in a transaction', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-1' })
    prisma.productComposition.findMany.mockResolvedValue([
      { id: 'composition-1', supplyId: 'supply-1', quantity: 2 },
    ])

    const response = await app.request('/api/products/product-1/composition', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        items: [{ supplyId: 'supply-1', quantity: 2 }],
      }),
    })

    expect(response.status).toBe(200)
    expect(tx.productComposition.deleteMany).toHaveBeenCalledWith({
      where: { productId: 'product-1' },
    })
    expect(tx.productComposition.createMany).toHaveBeenCalledWith({
      data: [{ productId: 'product-1', supplyId: 'supply-1', quantity: 2 }],
    })
  })

  it('blocks deleting products with linked business records', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      _count: { productions: 1, productionItems: 0, saleItems: 1 },
    })

    const response = await app.request('/api/products/product-1', {
      method: 'DELETE',
      headers: authHeaders,
    })

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('produções')
    expect(prisma.product.delete).not.toHaveBeenCalled()
  })
})
