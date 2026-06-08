export type StockBalance = {
  type: 'product' | 'supply'
  id: string
  name: string
  unit: string
  packageUnit?: string
  packageQuantity?: number
  stock: number
}

export type SaleReference = {
  id: string
  customer: string
  status: string
  createdAt: string
  deliveredAt: string | null
  deliveryDate: string | null
  completedAt: string | null
}

export type PurchaseReference = {
  id: string
  supplier: string
  status: string
  createdAt: string
  completedAt: string | null
}

export type ProductionReference = {
  id: string
  quantity: number
  status: string
  createdAt: string
  completedAt: string | null
  product: { id: string; name: string; unit: string }
}

export type AdjustmentReference = {
  id: string
  reason: string
  status: string
  createdAt: string
  completedAt: string | null
  reversedAt: string | null
  reversalReason: string
}

export type StockMovementReference =
  | { type: 'sale'; data: SaleReference }
  | { type: 'purchase'; data: PurchaseReference }
  | { type: 'production'; data: ProductionReference }
  | { type: 'adjustment'; data: AdjustmentReference }

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
  reference: StockMovementReference | null
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
