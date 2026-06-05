export type PurchaseStatus = 'pending' | 'completed'

export type PurchaseItem = {
  id: string
  purchaseId: string
  supplyId: string
  packages: number
  quantity: number
  packageCost: number
  supply: {
    id: string
    name: string
    unit: string
    packageUnit: string
    packageQuantity: number
  }
}

export type Purchase = {
  id: string
  vendorId: string | null
  supplier: string
  status: PurchaseStatus
  notes: string
  reversalReason: string
  reversedBy: string | null
  reversedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    name: string
    phone: string
    status: string
  } | null
  items: PurchaseItem[]
}

export const purchaseStatusMap: Record<
  PurchaseStatus,
  { label: string; variant: 'warning' | 'success' }
> = {
  pending: { label: 'Pendente', variant: 'warning' },
  completed: { label: 'Concluída', variant: 'success' },
}
