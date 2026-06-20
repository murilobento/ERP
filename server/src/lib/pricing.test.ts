import { describe, expect, it } from 'vitest'
import {
  computeKitPricing,
  computeProductCost,
  computeProductPrices,
  computeProductSalePrice,
  expandKitIntoSaleItems,
} from './pricing'

const productA = {
  margin: 50,
  composition: [{ quantity: 2, supply: { costPrice: 5 } }],
}

const productB = {
  margin: 100,
  composition: [{ quantity: 1, supply: { costPrice: 4 } }],
}

describe('product pricing', () => {
  it('sums composition into a cost price', () => {
    expect(computeProductCost(productA)).toBe(10)
  })

  it('applies the margin to derive the sale price', () => {
    expect(computeProductSalePrice(productA)).toBe(15)
    expect(computeProductSalePrice(productB)).toBe(8)
  })

  it('returns both cost and sale price together', () => {
    expect(computeProductPrices(productA)).toEqual({ costPrice: 10, salePrice: 15 })
  })
})

describe('kit pricing', () => {
  const items = [
    { quantity: 1, product: productA },
    { quantity: 2, product: productB },
  ]

  it('totals item prices, applies a fixed discount, and floors at zero', () => {
    expect(computeKitPricing({ discountType: 'fixed', discountValue: 3, items })).toEqual({
      totalPrice: 31,
      discount: 3,
      finalPrice: 28,
    })
  })

  it('applies a percentage discount', () => {
    expect(computeKitPricing({ discountType: 'percentage', discountValue: 10, items })).toEqual({
      totalPrice: 31,
      discount: 3.1,
      finalPrice: 27.9,
    })
  })

  it('never lets the final price go negative', () => {
    expect(
      computeKitPricing({ discountType: 'fixed', discountValue: 100, items }).finalPrice
    ).toBe(0)
  })
})

describe('expandKitIntoSaleItems', () => {
  const kit = {
    id: 'kit-1',
    discountType: 'fixed',
    discountValue: 3,
    items: [
      { productId: 'product-a', quantity: 1, product: productA },
      { productId: 'product-b', quantity: 2, product: productB },
    ],
  }

  it('scales quantities by the kit quantity and carries the kit id', () => {
    const expanded = expandKitIntoSaleItems(kit, 2)
    expect(expanded).toHaveLength(2)
    expect(expanded[0]).toMatchObject({ productId: 'product-a', quantity: 2, kitId: 'kit-1' })
    expect(expanded[1]).toMatchObject({ productId: 'product-b', quantity: 4, kitId: 'kit-1' })
  })

  it('distributes the discounted kit price proportionally across items', () => {
    const expanded = expandKitIntoSaleItems(kit, 2)
    expect(expanded[0].unitPrice).toBe(13.55)
    expect(expanded[1].unitPrice).toBe(7.23)

    const reconstructed = expanded.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    expect(Math.abs(reconstructed - 56)).toBeLessThanOrEqual(0.05)
  })
})
