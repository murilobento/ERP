export type PricedComposition = {
  quantity: number
  supply: { costPrice: number }
}

export type PricedProduct = {
  margin: number
  composition: PricedComposition[]
}

export function computeProductCost(product: PricedProduct): number {
  return product.composition.reduce(
    (sum, composition) => sum + composition.quantity * composition.supply.costPrice,
    0
  )
}

export function computeProductSalePrice(product: PricedProduct): number {
  return computeProductCost(product) * (1 + product.margin / 100)
}

export function computeProductPrices(product: PricedProduct): {
  costPrice: number
  salePrice: number
} {
  const costPrice = computeProductCost(product)
  return { costPrice, salePrice: costPrice * (1 + product.margin / 100) }
}

export type PricedKitItem = {
  quantity: number
  product: PricedProduct
}

export type DiscountableKit = {
  discountType: string
  discountValue: number
  items: PricedKitItem[]
}

export function computeKitPricing(kit: DiscountableKit): {
  totalPrice: number
  discount: number
  finalPrice: number
} {
  const totalPrice = kit.items.reduce(
    (sum, item) => sum + computeProductSalePrice(item.product) * item.quantity,
    0
  )
  const discount =
    kit.discountType === 'percentage'
      ? totalPrice * (kit.discountValue / 100)
      : kit.discountValue
  const finalPrice = Math.max(0, totalPrice - discount)
  return { totalPrice, discount, finalPrice }
}

export type ExpandableKit = {
  id: string
  discountType: string
  discountValue: number
  items: { productId: string; quantity: number; product: PricedProduct }[]
}

export type ExpandedSaleItem = {
  productId: string
  quantity: number
  unitPrice: number
  kitId: string
}

export function expandKitIntoSaleItems(kit: ExpandableKit, kitQuantity: number): ExpandedSaleItem[] {
  const { totalPrice, finalPrice } = computeKitPricing(kit)

  return kit.items.map((item) => {
    const contribution = computeProductSalePrice(item.product) * item.quantity
    const proportion = totalPrice > 0 ? contribution / totalPrice : 0
    const proportionalPrice = finalPrice * proportion
    const unitPrice = item.quantity > 0 ? proportionalPrice / item.quantity : 0

    return {
      productId: item.productId,
      quantity: item.quantity * kitQuantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
      kitId: kit.id,
    }
  })
}
