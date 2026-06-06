export type Client = {
  id: string
  name: string
  phone: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  status: string
  createdAt: string
  updatedAt: string
}

export type ClientSaleItem = {
  quantity: number
  unitPrice: number
  product: {
    id: string
    name: string
    unit: string
  }
}

export type ClientSale = {
  id: string
  status: string
  createdAt: string
  deliveredAt: string | null
  deliveryDate: string | null
  paymentMethod: string
  notes: string
  items: ClientSaleItem[]
}

export type ClientDetail = Client & {
  sales: ClientSale[]
}

export const saleStatusMap: Record<
  string,
  { label: string; variant: 'danger' | 'secondary' | 'blue' | 'success' }
> = {
  in_preparation: { label: 'Em preparo', variant: 'danger' },
  ready_for_delivery: { label: 'Pronto para entrega', variant: 'secondary' },
  delivered: { label: 'Entregue', variant: 'blue' },
  completed: { label: 'Concluído', variant: 'success' },
}

export function getSaleTotal(sale: Pick<ClientSale, 'items'>) {
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
