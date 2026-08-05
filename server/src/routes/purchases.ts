import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { recordPurchaseCompletion, recordPurchaseReversal } from '../lib/stock.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../lib/rbac.js'

const purchaseRoutes = new Hono()

purchaseRoutes.use('*', authMiddleware)

async function recalcSupplyCostPrice(tx: typeof prisma, supplyId: string) {
  const supply = await tx.supply.findUnique({ where: { id: supplyId } })
  if (!supply) return

  const lastItems = await tx.purchaseItem.findMany({
    where: {
      supplyId,
      purchase: { status: 'completed' },
    },
    orderBy: { purchase: { updatedAt: 'desc' } },
    take: 3,
  })

  if (lastItems.length === 0) {
    await tx.supply.update({ where: { id: supplyId }, data: { costPrice: 0 } })
    return
  }

  const pkgQty = supply.packageQuantity || 1
  const avg =
    lastItems.reduce((sum, item) => sum + item.packageCost / pkgQty, 0) /
    lastItems.length

  await tx.supply.update({ where: { id: supplyId }, data: { costPrice: avg } })
}

const PURCHASE_SELECT = {
  id: true,
  vendorId: true,
  supplier: true,
  status: true,
  notes: true,
  reversalReason: true,
  reversedBy: true,
  reversedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  vendor: {
    select: { id: true, name: true, phone: true, status: true },
  },
  items: {
    select: {
      id: true,
      supplyId: true,
      packages: true,
      quantity: true,
      packageCost: true,
      supply: {
        select: { id: true, name: true, unit: true, packageUnit: true, packageQuantity: true },
      },
    },
  },
}

purchaseRoutes.get('/', async (c) => {
  const status = c.req.query('status')

  const where = status ? { status } : {}

  const purchases = await prisma.purchase.findMany({
    where,
    select: PURCHASE_SELECT,
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ purchases })
})

purchaseRoutes.post('/', requireRole('admin', 'manager', 'operator'), async (c) => {
  const body = await c.req.json()
  const { vendorId, notes, items } = body as {
    vendorId: string
    notes?: string
    items: { supplyId: string; packages: number; packageCost: number }[]
  }

  if (!vendorId) {
    return c.json({ error: 'Fornecedor é obrigatório.' }, 400)
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor || vendor.status !== 'active') {
    return c.json({ error: 'Fornecedor não encontrado ou inativo.' }, 404)
  }

  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: 'Pelo menos um item é obrigatório.' }, 400)
  }

  for (const item of items) {
    if (!item.supplyId || !item.packages || item.packages <= 0) {
      return c.json({ error: 'Cada item deve ter insumo e número de embalagens (> 0).' }, 400)
    }
  }
  if (new Set(items.map((item) => item.supplyId)).size !== items.length) {
    return c.json({ error: 'Não é permitido repetir o mesmo insumo na compra.' }, 400)
  }

  const supplyIds = items.map((i) => i.supplyId)
  const supplies = await prisma.supply.findMany({
    where: { id: { in: supplyIds } },
  })

  if (supplies.length !== supplyIds.length) {
    return c.json({ error: 'Um ou mais insumos não encontrados.' }, 404)
  }

  const supplyMap = new Map(supplies.map((s) => [s.id, s]))

  const itemsWithQuantity = items.map((item) => ({
    supplyId: item.supplyId,
    packages: item.packages,
    quantity: item.packages * (supplyMap.get(item.supplyId)?.packageQuantity || 1),
    packageCost: item.packageCost || 0,
  }))

  const purchase = await prisma.purchase.create({
    data: {
      vendorId,
      supplier: vendor.name,
      notes: notes || '',
      status: 'pending',
      items: {
        createMany: { data: itemsWithQuantity },
      },
    },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase }, 201)
})

purchaseRoutes.get('/:id', async (c) => {
  const purchaseId = c.req.param('id')

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  if (!purchase) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  return c.json({ purchase })
})

purchaseRoutes.patch('/:id', requireRole('admin', 'manager', 'operator'), async (c) => {
  const purchaseId = c.req.param('id')
  const body = await c.req.json()
  const { vendorId, notes, items } = body as {
    vendorId?: string
    notes?: string
    items?: { supplyId: string; packages: number; packageCost: number }[]
  }

  const existing = await prisma.purchase.findUnique({ where: { id: purchaseId } })
  if (!existing) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas compras pendentes podem ser editadas.' }, 400)
  }

  const vendor = vendorId
    ? await prisma.vendor.findUnique({ where: { id: vendorId } })
    : null
  if (vendorId && (!vendor || vendor.status !== 'active')) {
    return c.json({ error: 'Fornecedor não encontrado ou inativo.' }, 404)
  }

  if (items) {
    for (const item of items) {
      if (!item.supplyId || !item.packages || item.packages <= 0) {
        return c.json({ error: 'Cada item deve ter insumo e número de embalagens (> 0).' }, 400)
      }
    }
    if (new Set(items.map((item) => item.supplyId)).size !== items.length) {
      return c.json({ error: 'Não é permitido repetir o mesmo insumo na compra.' }, 400)
    }
  }

  await prisma.$transaction(async (tx) => {
    const data: { vendorId?: string; supplier?: string; notes?: string } = {}
    if (vendor) {
      data.vendorId = vendor.id
      data.supplier = vendor.name
    }
    if (notes !== undefined) data.notes = notes

    await tx.purchase.update({
      where: { id: purchaseId },
      data,
    })

    if (items && items.length > 0) {
      await tx.purchaseItem.deleteMany({ where: { purchaseId } })

      const supplyIds = items.map((i) => i.supplyId)
      const supplies = await tx.supply.findMany({
        where: { id: { in: supplyIds } },
      })
      const supplyMap = new Map(supplies.map((s) => [s.id, s]))

      const itemsWithQuantity = items.map((item) => ({
        purchaseId,
        supplyId: item.supplyId,
        packages: item.packages,
        quantity: item.packages * (supplyMap.get(item.supplyId)?.packageQuantity || 1),
        packageCost: item.packageCost || 0,
      }))

      await tx.purchaseItem.createMany({ data: itemsWithQuantity })
    }
  })

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase })
})

purchaseRoutes.post('/:id/complete', requireRole('admin', 'manager', 'operator'), async (c) => {
  const purchaseId = c.req.param('id')
  const userId = c.get('userId') as string

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: {
        include: {
          supply: true,
        },
      },
    },
  })

  if (!existing) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Apenas compras pendentes podem ser concluídas.' }, 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'completed',
        reversalReason: '',
        reversedBy: null,
        reversedAt: null,
        completedAt: new Date(),
      },
    })

    await recordPurchaseCompletion(tx, {
      purchaseId,
      supplier: existing.supplier,
      authorId: userId,
      items: existing.items.map((item) => ({
        supplyId: item.supplyId,
        quantity: item.quantity,
        packages: item.packages,
        supply: {
          name: item.supply.name,
          unit: item.supply.unit,
          packageUnit: item.supply.packageUnit,
        },
      })),
    })

    const affectedSupplyIds = [...new Set(existing.items.map((i) => i.supplyId))]
    for (const supplyId of affectedSupplyIds) {
      await recalcSupplyCostPrice(tx, supplyId)
    }
  })

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase })
})

purchaseRoutes.post('/:id/reverse', requireRole('admin', 'manager', 'operator'), async (c) => {
  const purchaseId = c.req.param('id')
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { reason } = body as { reason: string }

  if (!reason || !reason.trim()) {
    return c.json({ error: 'Motivo do estorno é obrigatório.' }, 400)
  }

  const existing = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: {
        include: {
          supply: true,
        },
      },
    },
  })

  if (!existing) {
    return c.json({ error: 'Compra não encontrada.' }, 404)
  }

  if (existing.status !== 'completed') {
    return c.json({ error: 'Apenas compras concluídas podem ser estornadas.' }, 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })

  const authorName = user ? `${user.firstName} ${user.lastName}` : userId

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'pending',
        reversalReason: reason.trim(),
        reversedBy: userId,
        reversedAt: new Date(),
        completedAt: null,
      },
    })

    await recordPurchaseReversal(tx, {
      purchaseId,
      supplier: existing.supplier,
      authorId: userId,
      authorName,
      reason: reason.trim(),
      items: existing.items.map((item) => ({
        supplyId: item.supplyId,
        quantity: item.quantity,
        packages: item.packages,
        supply: {
          name: item.supply.name,
          unit: item.supply.unit,
          packageUnit: item.supply.packageUnit,
        },
      })),
    })

    const affectedSupplyIds = [...new Set(existing.items.map((i) => i.supplyId))]
    for (const supplyId of affectedSupplyIds) {
      await recalcSupplyCostPrice(tx, supplyId)
    }
  })

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: PURCHASE_SELECT,
  })

  return c.json({ purchase })
})

export { purchaseRoutes }
