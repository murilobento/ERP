export type PricedComposition = {
  quantity: number
  supply: { costPrice: number }
}

export type PricedProduct = {
  margin: number
  freightCost?: number
  packagingCost?: number
  composition: PricedComposition[]
}

export function computeProductCost(product: PricedProduct): number {
  const compositionCost = product.composition.reduce(
    (sum, composition) =>
      sum + composition.quantity * composition.supply.costPrice,
    0
  )
  const additionalCost =
    (product.freightCost ?? 0) + (product.packagingCost ?? 0)
  return compositionCost + additionalCost
}

export function computeProductSalePrice(product: PricedProduct): number {
  const cost = computeProductCost(product)
  if (product.margin >= 100) return Infinity
  return cost / (1 - product.margin / 100)
}

export function computeSalePriceFromMargin(
  cost: number,
  margin: number
): number {
  if (margin >= 100) return Infinity
  return cost / (1 - margin / 100)
}

export function computeMarginFromSalePrice(
  cost: number,
  salePrice: number
): number {
  if (salePrice <= cost) return 0
  return Math.round((1 - cost / salePrice) * 10000) / 100
}
