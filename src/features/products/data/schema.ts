export type Product = {
  id: string
  name: string
  description: string
  unit: string
  margin: number
  status: string
  createdAt: string
  updatedAt: string
  composition: CompositionItem[]
  stock: number
  costPrice: number
  salePrice: number
}

export type CompositionItem = {
  id: string
  supplyId: string
  quantity: number
  supply: {
    id: string
    name: string
    unit: string
    costPrice: number
  }
}
