import type { PrismaClient } from '@prisma/client'
import prisma from './prisma'

type StockDb = Pick<PrismaClient, 'stockMovement'>

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))]
}

function sumToNumber(value: number | null | undefined) {
  return value ?? 0
}

export async function getProductStockMap(
  productIds: string[],
  db: StockDb = prisma
) {
  const ids = uniqueIds(productIds)
  const stockById = new Map<string, number>()

  if (ids.length === 0) {
    return stockById
  }

  const rows = await db.stockMovement.groupBy({
    by: ['productId'],
    where: { productId: { in: ids } },
    _sum: { quantity: true },
  })

  for (const row of rows) {
    if (row.productId) {
      stockById.set(row.productId, sumToNumber(row._sum.quantity))
    }
  }

  return stockById
}

export async function getSupplyStockMap(
  supplyIds: string[],
  db: StockDb = prisma
) {
  const ids = uniqueIds(supplyIds)
  const stockById = new Map<string, number>()

  if (ids.length === 0) {
    return stockById
  }

  const rows = await db.stockMovement.groupBy({
    by: ['supplyId'],
    where: { supplyId: { in: ids } },
    _sum: { quantity: true },
  })

  for (const row of rows) {
    if (row.supplyId) {
      stockById.set(row.supplyId, sumToNumber(row._sum.quantity))
    }
  }

  return stockById
}

export async function getProductStock(productId: string, db: StockDb = prisma) {
  const result = await db.stockMovement.aggregate({
    where: { productId },
    _sum: { quantity: true },
  })

  return sumToNumber(result._sum.quantity)
}

export async function getSupplyStock(supplyId: string, db: StockDb = prisma) {
  const result = await db.stockMovement.aggregate({
    where: { supplyId },
    _sum: { quantity: true },
  })

  return sumToNumber(result._sum.quantity)
}
