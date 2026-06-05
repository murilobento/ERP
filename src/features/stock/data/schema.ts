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

export type StockAdjustmentStatus = 'pending' | 'completed' | 'reversed'

export type StockAdjustment = {
  id: string
  status: StockAdjustmentStatus
  itemType: 'product' | 'supply'
  productId: string | null
  supplyId: string | null
  quantity: number
  reason: string
  authorId: string
  completedById: string | null
  completedAt: string | null
  reversedById: string | null
  reversedAt: string | null
  reversalReason: string
  createdAt: string
  updatedAt: string
  product: { id: string; name: string; unit: string } | null
  supply: { id: string; name: string; unit: string } | null
  author: { id: string; firstName: string; lastName: string } | null
  completedBy: { id: string; firstName: string; lastName: string } | null
  reversedBy: { id: string; firstName: string; lastName: string } | null
}

export const stockAdjustmentStatusMap: Record<
  StockAdjustmentStatus,
  { label: string; variant: 'warning' | 'success' | 'destructive' }
> = {
  pending: { label: 'Pendente', variant: 'warning' },
  completed: { label: 'Concluído', variant: 'success' },
  reversed: { label: 'Estornado', variant: 'destructive' },
}
