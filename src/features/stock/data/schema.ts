export type StockBalance = {
  type: 'product' | 'supply'
  id: string
  name: string
  unit: string
  packageUnit?: string
  packageQuantity?: number
  stock: number
}

export type StockMovement = {
  id: string
  productId: string | null
  supplyId: string | null
  quantity: number
  type: string
  referenceId: string | null
  notes: string
  createdAt: string
  product: { id: string; name: string; unit: string } | null
  supply: { id: string; name: string; unit: string } | null
}
