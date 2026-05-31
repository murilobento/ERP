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
  status: 'pending' | 'completed'
  notes: string
  reversalReason: string
  reversedBy: string | null
  reversedAt: string | null
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
