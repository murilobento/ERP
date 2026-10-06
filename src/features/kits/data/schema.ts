export type KitItem = {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
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

import { computeProductSalePrice } from '@/lib/pricing'

export function computeKitSalePrice(items: KitItem[]) {
  return items.reduce(
    (sum, item) => sum + computeProductSalePrice(item.product) * item.quantity,
    0
  )
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
