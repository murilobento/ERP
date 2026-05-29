export type Production = {
  id: string
  productId: string
  quantity: number
  status: 'draft' | 'in_production' | 'completed' | 'cancelled'
  notes: string
  reversalReason: string
  reversedBy: string | null
  reversedAt: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  product: {
    id: string
    name: string
    unit: string
  }
}

export type CompositionNeeded = {
  supplyId: string
  supplyName: string
  unit: string
  needed: number
  available: number
  sufficient: boolean
}

export type ProductionDetail = Production & {
  product: Production['product'] & {
    composition: {
      id: string
      supplyId: string
      quantity: number
      supply: { id: string; name: string; unit: string }
    }[]
  }
  compositionNeeded: CompositionNeeded[]
}
