export type Supply = {
  id: string
  name: string
  description: string
  unit: string
  packageUnit: string
  packageQuantity: number
  costPrice: number
  status: string
  createdAt: string
  updatedAt: string
}

export type SupplyWithStock = Supply & {
  stock: number
}

export type SupplyPurchaseHistoryItem = {
  id: string
  supplier: string
  status: string
  createdAt: string
  completedAt: string | null
  packages: number
  quantity: number
  packageCost: number
  unitPrice: number
  total: number
}

export type SupplyPurchaseHistory = {
  supply: Supply
  purchases: SupplyPurchaseHistoryItem[]
  summary: {
    count: number
    totalSpent: number
    avgUnitPrice: number
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const supplyPurchaseStatusMap: Record<
  string,
  { label: string; variant: 'warning' | 'success' }
> = {
  pending: { label: 'Pendente', variant: 'warning' },
  completed: { label: 'Concluída', variant: 'success' },
}
