export type SaleStatus =
  | 'in_preparation'
  | 'ready_for_delivery'
  | 'delivered'
  | 'completed'

export type SaleItem = {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  product: {
    id: string
    name: string
    unit: string
    status: string
  }
}

export type Sale = {
  id: string
  clientId: string
  customer: string
  status: SaleStatus
  notes: string
  paymentMethod: string
  paidAt: string | null
  paymentNotes: string
  reversalReason: string
  reversedBy: string | null
  reversedAt: string | null
  deliveredAt: string | null
  deliveryDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    phone: string
    status: string
  }
  items: SaleItem[]
}

export const saleStatusMap: Record<
  SaleStatus,
  { label: string; variant: 'danger' | 'secondary' | 'blue' | 'success' }
> = {
  in_preparation: { label: 'Em preparo', variant: 'danger' },
  ready_for_delivery: { label: 'Pronto para entrega', variant: 'secondary' },
  delivered: { label: 'Entregue', variant: 'blue' },
  completed: { label: 'Concluído', variant: 'success' },
}

export const paymentMethodMap: Record<string, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  bank_transfer: 'Transferência',
  boleto: 'Boleto',
  other: 'Outro',
}

export function getSaleTotal(sale: Pick<Sale, 'items'>) {
  return sale.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
