export type KitItem = {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    unit: string
    status: string
    margin: number
    composition: {
      quantity: number
      supply: { costPrice: number }
    }[]
  }
}

export type Kit = {
  id: string
  name: string
  description: string
  status: string
  discountType: string
  discountValue: number
  createdAt: string
  updatedAt: string
  items: KitItem[]
  totalPrice: number
  discount: number
  finalPrice: number
}

export function computeKitSalePrice(items: KitItem[]) {
  return items.reduce((sum, item) => {
    const costPrice = item.product.composition.reduce(
      (s, c) => s + c.quantity * c.supply.costPrice,
      0
    )
    const salePrice = costPrice * (1 + item.product.margin / 100)
    return sum + salePrice * item.quantity
  }, 0)
}

export function computeKitDiscount(
  totalPrice: number,
  discountType: string,
  discountValue: number
) {
  return discountType === 'percentage'
    ? totalPrice * (discountValue / 100)
    : discountValue
}

export function computeKitFinalPrice(
  totalPrice: number,
  discountType: string,
  discountValue: number
) {
  const discount = computeKitDiscount(totalPrice, discountType, discountValue)
  return Math.max(0, totalPrice - discount)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
