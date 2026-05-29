export type Supply = {
  id: string
  name: string
  description: string
  unit: string
  packageUnit: string
  packageQuantity: number
  status: string
  createdAt: string
  updatedAt: string
}

export type SupplyWithStock = Supply & {
  stock: number
}
