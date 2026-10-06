import prisma from '../lib/prisma.js'
import {
  CONTACT_SELECT,
  SEARCH_SELECT,
  createContactRoutes,
} from '../lib/contact-routes.js'

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
        select: { id: true, name: true },
      },
    },
  },
} as const

const CLIENT_DETAIL_SELECT = {
  ...CONTACT_SELECT,
  sales: {
    select: CLIENT_SALES_SELECT,
    orderBy: { createdAt: 'desc' },
    take: 20,
  },
} as const

const clientRoutes = createContactRoutes({
  entityName: 'Cliente',
  responseKey: 'client',
  pluralResponseKey: 'clients',
  operations: {
    list: () =>
      prisma.client.findMany({
        select: CONTACT_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
    search: ({ query, status, limit }) =>
      prisma.client.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          ...(status ? { status } : {}),
        },
        select: SEARCH_SELECT,
        orderBy: { name: 'asc' },
        take: limit,
      }),
    create: (data) =>
      prisma.client.create({ data, select: CONTACT_SELECT }),
    getById: (id, details) =>
      details
        ? prisma.client.findUnique({
            where: { id },
            select: CLIENT_DETAIL_SELECT,
          })
        : prisma.client.findUnique({ where: { id }, select: CONTACT_SELECT }),
    update: (id, data) =>
      prisma.client.update({ where: { id }, data, select: CONTACT_SELECT }),
    updateStatus: (id, status) =>
      prisma.client.update({
        where: { id },
        data: { status },
        select: CONTACT_SELECT,
      }),
    },
})

export { clientRoutes }
