export type ProductionItem = {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    unit: string
  }
}

export type Production = {
  id: string
  productId: string
  quantity: number
  status: 'in_production' | 'completed' | 'cancelled'
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
  items: ProductionItem[]
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
  items: (ProductionItem & {
    product: ProductionItem['product'] & {
      composition: {
        id: string
        supplyId: string
        quantity: number
        supply: { id: string; name: string; unit: string }
      }[]
    }
  })[]
}
