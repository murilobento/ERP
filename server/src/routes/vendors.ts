import prisma from '../lib/prisma.js'
import {
  CONTACT_SELECT,
  SEARCH_SELECT,
  createContactRoutes,
} from '../lib/contact-routes.js'

const vendorRoutes = createContactRoutes({
  entityName: 'Fornecedor',
  responseKey: 'vendor',
  pluralResponseKey: 'vendors',
  operations: {
    list: () =>
      prisma.vendor.findMany({
        select: CONTACT_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
    search: ({ query, status, limit }) =>
      prisma.vendor.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          ...(status ? { status } : {}),
        },
        select: SEARCH_SELECT,
        orderBy: { name: 'asc' },
        take: limit,
      }),
    create: (data) =>
      prisma.vendor.create({ data, select: CONTACT_SELECT }),
    getById: (id) =>
      prisma.vendor.findUnique({ where: { id }, select: CONTACT_SELECT }),
    update: (id, data) =>
      prisma.vendor.update({ where: { id }, data, select: CONTACT_SELECT }),
    updateStatus: (id, status) =>
      prisma.vendor.update({
        where: { id },
        data: { status },
        select: CONTACT_SELECT,
      }),
  },
})

export { vendorRoutes }
