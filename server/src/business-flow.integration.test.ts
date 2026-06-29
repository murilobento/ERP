import { describe, expect, it } from 'vitest'

const hasTestDatabase = Boolean(process.env.DATABASE_URL_TEST)

describe.skipIf(!hasTestDatabase)('business flow integration', () => {
  it('moves stock through purchase, production, sale delivery, and reversals', async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret'

    const [{ createApp }, { default: prisma }, auth] = await Promise.all([
      import('./app'),
      import('./lib/prisma'),
      import('./lib/auth'),
    ])
    const app = createApp({ enableLogger: false })

    await resetDatabase(prisma)

    const user = await prisma.user.create({
      data: {
        email: 'integration@example.com',
        password: await auth.hashPassword('admin123'),
        firstName: 'Integration',
        lastName: 'User',
      },
    })
    const category = await prisma.category.create({
      data: { name: 'Bolos', status: 'active' },
    })
    const supply = await prisma.supply.create({
      data: {
        name: 'Farinha',
        unit: 'kg',
        packageUnit: 'saco',
        packageQuantity: 5,
        status: 'active',
      },
    })
    const product = await prisma.product.create({
      data: {
        name: 'Bolo',
        unit: 'un',
        categoryId: category.id,
        status: 'active',
        composition: {
          create: [{ supplyId: supply.id, quantity: 2 }],
        },
      },
    })
    const vendor = await prisma.vendor.create({
      data: { name: 'Fornecedor', phone: '123', status: 'active' },
    })
    const client = await prisma.client.create({
      data: { name: 'Cliente', phone: '456', status: 'active' },
    })

    const headers = {
      'Content-Type': 'application/json',
      Cookie: `access_token=${auth.signAccessToken(user.id)}`,
    }

    const purchaseResponse = await app.request('/api/purchases', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vendorId: vendor.id,
        items: [{ supplyId: supply.id, packages: 2, packageCost: 50 }],
      }),
    })
    expect(purchaseResponse.status).toBe(201)
    const purchase = (await purchaseResponse.json()).purchase

    expect(
      await app.request(`/api/purchases/${purchase.id}/complete`, {
        method: 'POST',
        headers,
      })
    ).toHaveProperty('status', 200)
    await expectStock(prisma, { supplyId: supply.id }, 10)

    const productionResponse = await app.request('/api/productions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId: product.id,
        quantity: 3,
      }),
    })
    expect(productionResponse.status).toBe(201)
    const production = (await productionResponse.json()).production

    expect(
      await app.request(`/api/productions/${production.id}/complete`, {
        method: 'POST',
        headers,
      })
    ).toHaveProperty('status', 200)
    await expectStock(prisma, { supplyId: supply.id }, 4)
    await expectStock(prisma, { productId: product.id }, 3)

    const saleResponse = await app.request('/api/sales', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clientId: client.id,
        deliveryDate: '2026-06-10',
        items: [{ productId: product.id, quantity: 2, unitPrice: 25 }],
      }),
    })
    expect(saleResponse.status).toBe(201)
    const sale = (await saleResponse.json()).sale

    expect(
      await app.request(`/api/sales/${sale.id}/ready-for-delivery`, {
        method: 'POST',
        headers,
      })
    ).toHaveProperty('status', 200)
    expect(
      await app.request(`/api/sales/${sale.id}/deliver`, {
        method: 'POST',
        headers,
      })
    ).toHaveProperty('status', 200)
    await expectStock(prisma, { productId: product.id }, 1)

    expect(
      await app.request(`/api/sales/${sale.id}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          paymentMethod: 'Pix',
          paidAt: '2026-06-10T12:00:00.000Z',
        }),
      })
    ).toHaveProperty('status', 200)
    expect(
      await app.request(`/api/sales/${sale.id}/reverse`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Teste de integração' }),
      })
    ).toHaveProperty('status', 200)
    await expectStock(prisma, { productId: product.id }, 3)

    expect(
      await app.request(`/api/productions/${production.id}/reverse`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Teste de integração' }),
      })
    ).toHaveProperty('status', 200)
    await expectStock(prisma, { productId: product.id }, 0)
    await expectStock(prisma, { supplyId: supply.id }, 10)

    expect(
      await app.request(`/api/purchases/${purchase.id}/reverse`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Teste de integração' }),
      })
    ).toHaveProperty('status', 200)
    await expectStock(prisma, { supplyId: supply.id }, 0)

    await prisma.$disconnect()
  })
})

async function resetDatabase(prisma: Awaited<typeof import('./lib/prisma')>['default']) {
  await prisma.stockMovement.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.purchaseItem.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.productionItem.deleteMany()
  await prisma.production.deleteMany()
  await prisma.productComposition.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supply.deleteMany()
  await prisma.category.deleteMany()
  await prisma.client.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()
}

async function expectStock(
  prisma: Awaited<typeof import('./lib/prisma')>['default'],
  where: { productId: string } | { supplyId: string },
  expected: number
) {
  const result = await prisma.stockMovement.aggregate({
    where,
    _sum: { quantity: true },
  })
  expect(result._sum.quantity || 0).toBe(expected)
}
