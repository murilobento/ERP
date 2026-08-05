import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const dashboardRoutes = new Hono()

dashboardRoutes.use('*', authMiddleware)

dashboardRoutes.get('/metrics', async (c) => {
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const completedSales = await prisma.sale.findMany({
    where: {
      status: 'completed',
      completedAt: { gte: twelveMonthsAgo },
    },
    select: {
      id: true,
      clientId: true,
      customer: true,
      status: true,
      completedAt: true,
      createdAt: true,
      client: { select: { id: true, name: true } },
      items: { select: { quantity: true, unitPrice: true } },
    },
  })

  const completedPurchases = await prisma.purchase.findMany({
    where: {
      status: 'completed',
      completedAt: { gte: twelveMonthsAgo },
    },
    select: {
      completedAt: true,
      items: { select: { packages: true, packageCost: true } },
    },
  })

  const allSales = await prisma.sale.findMany({
    select: {
      status: true,
      items: { select: { quantity: true, unitPrice: true } },
    },
  })

  const getSaleTotal = (items: { quantity: number; unitPrice: number }[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const getPurchaseTotal = (items: { packages: number; packageCost: number }[]) =>
    items.reduce((sum, item) => sum + item.packages * item.packageCost, 0)

  // KPIs
  const totalRevenue = allSales
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + getSaleTotal(s.items), 0)

  const totalCost = completedPurchases.reduce(
    (sum, p) => sum + getPurchaseTotal(p.items),
    0,
  )

  const grossProfit = totalRevenue - totalCost
  const openOrders = allSales.filter((s) => s.status !== 'completed').length
  const toReceive = allSales
    .filter((s) => s.status !== 'completed')
    .reduce((sum, s) => sum + getSaleTotal(s.items), 0)

  // Monthly aggregation
  const monthlyMap = new Map<string, { revenue: number; cost: number }>()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, { revenue: 0, cost: 0 })
  }

  for (const sale of completedSales) {
    const date = sale.completedAt ? new Date(sale.completedAt) : new Date(sale.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const entry = monthlyMap.get(key)
    if (entry) entry.revenue += getSaleTotal(sale.items)
  }

  for (const purchase of completedPurchases) {
    const date = purchase.completedAt
      ? new Date(purchase.completedAt)
      : new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const entry = monthlyMap.get(key)
    if (entry) entry.cost += getPurchaseTotal(purchase.items)
  }

  const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    cost: data.cost,
  }))

  // Top clients
  const clientTotals = new Map<string, { name: string; total: number }>()
  for (const sale of completedSales) {
    const client = sale.client
    const existing = clientTotals.get(client.id)
    const total = getSaleTotal(sale.items)
    if (existing) {
      existing.total += total
    } else {
      clientTotals.set(client.id, { name: client.name, total })
    }
  }
  const topClients = Array.from(clientTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Recent sales
  const recentSalesRaw = await prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customer: true,
      status: true,
      createdAt: true,
      items: { select: { quantity: true, unitPrice: true } },
    },
  })
  const recentSales = recentSalesRaw.map((sale) => ({
    id: sale.id,
    customer: sale.customer,
    total: getSaleTotal(sale.items),
    status: sale.status,
    createdAt: sale.createdAt,
  }))

  return c.json({
    kpis: { totalRevenue, totalCost, grossProfit, openOrders, toReceive },
    monthly,
    topClients,
    recentSales,
  })
})

dashboardRoutes.get('/analytics', async (c) => {
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const completedSales = await prisma.sale.findMany({
    where: {
      status: 'completed',
      completedAt: { gte: twelveMonthsAgo },
    },
    select: {
      paymentMethod: true,
      status: true,
      completedAt: true,
      createdAt: true,
      items: { select: { quantity: true, unitPrice: true } },
    },
  })

  const allSales = await prisma.sale.findMany({
    select: {
      paymentMethod: true,
      status: true,
      items: { select: { quantity: true, unitPrice: true } },
    },
  })

  const getSaleTotal = (items: { quantity: number; unitPrice: number }[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  // By payment method
  const methodMap = new Map<string, { count: number; total: number }>()
  for (const sale of allSales) {
    if (sale.status !== 'completed') continue
    const method = sale.paymentMethod || 'other'
    const existing = methodMap.get(method)
    const total = getSaleTotal(sale.items)
    if (existing) {
      existing.count += 1
      existing.total += total
    } else {
      methodMap.set(method, { count: 1, total })
    }
  }
  const byPaymentMethod = Array.from(methodMap.entries()).map(
    ([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
    }),
  )

  // By status
  const statusMap = new Map<string, { count: number; total: number }>()
  for (const sale of allSales) {
    const existing = statusMap.get(sale.status)
    const total = getSaleTotal(sale.items)
    if (existing) {
      existing.count += 1
      existing.total += total
    } else {
      statusMap.set(sale.status, { count: 1, total })
    }
  }
  const byStatus = Array.from(statusMap.entries()).map(
    ([status, data]) => ({
      status,
      count: data.count,
      total: data.total,
    }),
  )

  // Monthly profit (revenue from completed sales only)
  const completedPurchases = await prisma.purchase.findMany({
    where: {
      status: 'completed',
      completedAt: { gte: twelveMonthsAgo },
    },
    select: {
      completedAt: true,
      items: { select: { packages: true, packageCost: true } },
    },
  })

  const getPurchaseTotal = (items: { packages: number; packageCost: number }[]) =>
    items.reduce((sum, item) => sum + item.packages * item.packageCost, 0)

  const monthlyMap = new Map<string, { revenue: number; cost: number }>()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, { revenue: 0, cost: 0 })
  }

  for (const sale of completedSales) {
    const date = sale.completedAt ? new Date(sale.completedAt) : new Date(sale.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const entry = monthlyMap.get(key)
    if (entry) entry.revenue += getSaleTotal(sale.items)
  }

  for (const purchase of completedPurchases) {
    const date = purchase.completedAt
      ? new Date(purchase.completedAt)
      : new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const entry = monthlyMap.get(key)
    if (entry) entry.cost += getPurchaseTotal(purchase.items)
  }

  const monthlyProfit = Array.from(monthlyMap.entries()).map(
    ([month, data]) => ({
      month,
      profit: data.revenue - data.cost,
    }),
  )

  // Additional KPIs
  const completedCount = allSales.filter((s) => s.status === 'completed').length
  const avgTicket = completedCount > 0
    ? allSales
        .filter((s) => s.status === 'completed')
        .reduce((sum, s) => sum + getSaleTotal(s.items), 0) / completedCount
    : 0

  const totalAll = allSales.reduce(
    (sum, s) => sum + getSaleTotal(s.items),
    0,
  )
  const paidTotal = allSales
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + getSaleTotal(s.items), 0)
  const paidPercentage = totalAll > 0 ? (paidTotal / totalAll) * 100 : 0
  const pendingPercentage = totalAll > 0 ? 100 - paidPercentage : 0

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonthSales = completedSales.filter((s) => {
    const date = s.completedAt ? new Date(s.completedAt) : new Date(s.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return key === currentMonth
  })
  const salesThisMonth = currentMonthSales.length

  return c.json({
    byPaymentMethod,
    byStatus,
    monthlyProfit,
    avgTicket,
    paidPercentage,
    pendingPercentage,
    salesThisMonth,
  })
})

export { dashboardRoutes }
