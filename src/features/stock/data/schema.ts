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
  authorId?: string | null
  quantity: number
  stockBefore: number | null
  stockAfter: number | null
  type: string
  referenceId: string | null
  notes: string
  createdAt: string
  product: { id: string; name: string; unit: string } | null
  supply: { id: string; name: string; unit: string } | null
  author: { id: string; firstName: string; lastName: string } | null
}
