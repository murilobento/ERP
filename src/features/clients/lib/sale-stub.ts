import type { Sale } from '@/features/sales/data/schema'
import type { Client, ClientSale } from '../data/schema'

export function buildSaleStub(sale: ClientSale, client: Client): Sale {
  return {
    id: sale.id,
    clientId: client.id,
    customer: client.name,
    status: sale.status as Sale['status'],
    notes: sale.notes,
    paymentMethod: sale.paymentMethod,
    paidAt: null,
    paymentNotes: '',
    reversalReason: '',
    reversedBy: null,
    reversedAt: null,
    deliveredAt: sale.deliveredAt,
    deliveryDate: sale.deliveryDate,
    completedAt: null,
    createdAt: sale.createdAt,
    updatedAt: sale.createdAt,
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      status: client.status,
    },
    items: sale.items.map((item, index) => ({
      id: `${sale.id}-${index}`,
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      kitId: null,
      product: {
        id: item.product.id,
        name: item.product.name,
        status: '',
      },
    })),
  }
}
