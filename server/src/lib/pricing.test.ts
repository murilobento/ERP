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
  margin: 20,
  composition: [{ quantity: 1, supply: { costPrice: 4 } }],
}

describe('product pricing', () => {
  it('sums composition into a cost price', () => {
    expect(computeProductCost(productA)).toBe(10)
  })

  it('adds freight and packaging into the total cost', () => {
    expect(
      computeProductCost({
        margin: 50,
        freightCost: 8,
        packagingCost: 5,
        composition: [{ quantity: 2, supply: { costPrice: 5 } }],
      })
    ).toBe(23)
  })

  it('applies the margin on the sale price to derive the sale price', () => {
    expect(computeProductSalePrice(productA)).toBe(20)
    expect(computeProductSalePrice(productB)).toBe(5)
  })

  it('never divides by zero when margin reaches 100', () => {
    expect(
      computeProductSalePrice({ margin: 100, composition: productA.composition })
    ).toBe(Infinity)
  })

  it('returns both cost and sale price together', () => {
    expect(computeProductPrices(productA)).toEqual({ costPrice: 10, salePrice: 20 })
  })
})

describe('kit pricing', () => {
  const items = [
    { quantity: 1, product: productA },
    { quantity: 2, product: productB },
  ]

  it('totals item prices, applies a fixed discount, and floors at zero', () => {
    expect(computeKitPricing({ discountType: 'fixed', discountValue: 3, items })).toEqual({
      totalPrice: 30,
      discount: 3,
      finalPrice: 27,
    })
  })

  it('applies a percentage discount', () => {
    expect(computeKitPricing({ discountType: 'percentage', discountValue: 10, items })).toEqual({
      totalPrice: 30,
      discount: 3,
      finalPrice: 27,
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
    expect(expanded[0].unitPrice).toBe(18)
    expect(expanded[1].unitPrice).toBe(4.5)

    const reconstructed = expanded.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    expect(Math.abs(reconstructed - 54)).toBeLessThanOrEqual(0.05)
  })
})
