import { createContactRoutes } from '../lib/contact-routes'

const CLIENT_SALES_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  deliveredAt: true,
  deliveryDate: true,
  paymentMethod: true,
  notes: true,
  items: {
    select: {
      quantity: true,
      unitPrice: true,
      product: {
        select: { id: true, name: true, unit: true },
      },
    },
  },
}

const clientRoutes = createContactRoutes({
  model: 'client',
  entityName: 'Cliente',
  responseKey: 'client',
  pluralResponseKey: 'clients',
  detailSelect: {
    id: true,
    name: true,
    phone: true,
    zipCode: true,
    street: true,
    number: true,
    complement: true,
    neighborhood: true,
    city: true,
    state: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    sales: {
      select: CLIENT_SALES_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 20,
    },
  },
})

export { clientRoutes }
