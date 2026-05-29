export type Product = {
  id: string
  name: string
  description: string
  unit: string
  status: string
  createdAt: string
  updatedAt: string
  composition: CompositionItem[]
  stock: number
}

export type CompositionItem = {
  id: string
  supplyId: string
  quantity: number
  supply: {
    id: string
    name: string
    unit: string
  }
}
