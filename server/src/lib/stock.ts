import type { PrismaClient } from '@prisma/client'
import prisma from './prisma'

type StockDb = Pick<PrismaClient, 'stockMovement'>

type ItemKind = 'product' | 'supply'

export const MOVEMENT_TYPE = {
  SALE_DELIVERY: 'sale_delivery',
  SALE_REVERSAL: 'sale_reversal',
  PURCHASE: 'purchase',
  PURCHASE_REVERSAL: 'purchase_reversal',
  PRODUCTION_OUTPUT: 'production_output',
  PRODUCTION_CONSUMPTION: 'production_consumption',
  PRODUCTION_REVERSAL: 'production_reversal',
  ADJUSTMENT: 'adjustment',
  ADJUSTMENT_REVERSAL: 'adjustment_reversal',
} as const

export type MovementParentEntity = 'sale' | 'purchase' | 'production' | 'adjustment'

export function movementParentEntity(type: string): MovementParentEntity | null {
  if (type.startsWith('sale')) return 'sale'
  if (type.startsWith('purchase')) return 'purchase'
  if (type.startsWith('production')) return 'production'
  if (type.startsWith('adjustment')) return 'adjustment'
  return null
}

export class StockLedgerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StockLedgerError'
  }
}

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

type CompositionRow = {
  supplyId: string
  quantity: number
  supply: { name: string; unit: string }
}

type ConsumableItem = {
  quantity: number
  product: { composition: CompositionRow[] }
}

export function expandConsumption<TItem extends ConsumableItem>(items: TItem[]) {
  const consumption = new Map<string, { quantity: number; name: string; unit: string }>()

  for (const item of items) {
    for (const comp of item.product.composition) {
      const quantity = comp.quantity * item.quantity
      const current = consumption.get(comp.supplyId)

      if (current) {
        current.quantity += quantity
      } else {
        consumption.set(comp.supplyId, {
          quantity,
          name: comp.supply.name,
          unit: comp.supply.unit,
        })
      }
    }
  }

  return consumption
}

type PendingMovement = {
  kind: ItemKind
  id: string
  name: string
  quantity: number
  type: string
  referenceId: string
  notes: string
}

type InsufficientContext = {
  name: string
  available: number
  needed: number
}

async function commitMovements(
  tx: StockDb,
  authorId: string | null,
  pending: PendingMovement[],
  options: {
    enforceNonNegative?: boolean
    formatInsufficient?: (ctx: InsufficientContext) => string
  } = {}
) {
  const productIds = uniqueIds(
    pending.filter((movement) => movement.kind === 'product').map((movement) => movement.id)
  )
  const supplyIds = uniqueIds(
    pending.filter((movement) => movement.kind === 'supply').map((movement) => movement.id)
  )

  const productBalance = await getProductStockMap(productIds, tx)
  const supplyBalance = await getSupplyStockMap(supplyIds, tx)
  const running = new Map<string, number>()

  const balanceOf = (kind: ItemKind, id: string) => {
    const key = `${kind}:${id}`
    if (running.has(key)) return running.get(key) as number
    const base = kind === 'product' ? productBalance.get(id) : supplyBalance.get(id)
    return base ?? 0
  }

  type Planned = { movement: PendingMovement; before: number; after: number }
  const planned: Planned[] = []

  for (const movement of pending) {
    const before = balanceOf(movement.kind, movement.id)
    const after = before + movement.quantity
    running.set(`${movement.kind}:${movement.id}`, after)
    planned.push({ movement, before, after })
  }

  if (options.enforceNonNegative) {
    for (const { movement, before, after } of planned) {
      if (after < 0) {
        const message = options.formatInsufficient
          ? options.formatInsufficient({
              name: movement.name,
              available: before,
              needed: -movement.quantity,
            })
          : `Estoque insuficiente para ${movement.name}. Disponível: ${before}.`
        throw new StockLedgerError(message)
      }
    }
  }

  for (const { movement, before, after } of planned) {
    await tx.stockMovement.create({
      data: {
        productId: movement.kind === 'product' ? movement.id : null,
        supplyId: movement.kind === 'supply' ? movement.id : null,
        authorId,
        quantity: movement.quantity,
        stockBefore: before,
        stockAfter: after,
        type: movement.type,
        referenceId: movement.referenceId,
        notes: movement.notes,
      },
    })
  }
}

type SaleMovementItem = {
  productId: string
  quantity: number
  product: { name: string; unit: string }
}

export async function recordSaleDelivery(
  tx: StockDb,
  input: {
    saleId: string
    customer: string
    authorId: string
    items: SaleMovementItem[]
  }
) {
  const pending: PendingMovement[] = input.items.map((item) => ({
    kind: 'product',
    id: item.productId,
    name: item.product.name,
    quantity: -item.quantity,
    type: MOVEMENT_TYPE.SALE_DELIVERY,
    referenceId: input.saleId,
    notes: `Venda para ${input.customer} — entrega de ${item.quantity} ${item.product.unit} de ${item.product.name}`,
  }))

  await commitMovements(tx, input.authorId, pending, {
    enforceNonNegative: true,
    formatInsufficient: ({ name, available }) =>
      `Estoque insuficiente para ${name}. Disponível: ${available}.`,
  })
}

export async function recordSaleReversal(
  tx: StockDb,
  input: {
    saleId: string
    customer: string
    authorId: string
    reason: string
    items: SaleMovementItem[]
  }
) {
  const pending: PendingMovement[] = input.items.map((item) => ({
    kind: 'product',
    id: item.productId,
    name: item.product.name,
    quantity: item.quantity,
    type: MOVEMENT_TYPE.SALE_REVERSAL,
    referenceId: input.saleId,
    notes: `Estorno da venda para ${input.customer} — devolução de ${item.quantity} ${item.product.unit} de ${item.product.name} | Motivo: ${input.reason}`,
  }))

  await commitMovements(tx, input.authorId, pending)
}

type PurchaseMovementItem = {
  supplyId: string
  quantity: number
  packages: number
  supply: { name: string; unit: string; packageUnit: string }
}

export async function recordPurchaseCompletion(
  tx: StockDb,
  input: {
    purchaseId: string
    supplier: string
    authorId: string
    items: PurchaseMovementItem[]
  }
) {
  const pending: PendingMovement[] = input.items.map((item) => ({
    kind: 'supply',
    id: item.supplyId,
    name: item.supply.name,
    quantity: item.quantity,
    type: MOVEMENT_TYPE.PURCHASE,
    referenceId: input.purchaseId,
    notes: `Compra de ${input.supplier} — ${item.packages} ${item.supply.packageUnit || 'embalagem'}(s) de ${item.supply.name} → ${item.quantity} ${item.supply.unit}`,
  }))

  await commitMovements(tx, input.authorId, pending)
}

export async function recordPurchaseReversal(
  tx: StockDb,
  input: {
    purchaseId: string
    supplier: string
    authorId: string
    authorName: string
    reason: string
    items: PurchaseMovementItem[]
  }
) {
  const pending: PendingMovement[] = input.items.map((item) => ({
    kind: 'supply',
    id: item.supplyId,
    name: item.supply.name,
    quantity: -item.quantity,
    type: MOVEMENT_TYPE.PURCHASE_REVERSAL,
    referenceId: input.purchaseId,
    notes: `Estorno da compra de ${input.supplier} — ${item.quantity} ${item.supply.unit} de ${item.supply.name} | Motivo: ${input.reason} | Autor: ${input.authorName}`,
  }))

  await commitMovements(tx, input.authorId, pending)
}

type ProductionMovementItem = {
  productId: string
  quantity: number
  product: {
    name: string
    unit: string
    composition: CompositionRow[]
  }
}

export async function recordProductionCompletion(
  tx: StockDb,
  input: {
    productionId: string
    authorId: string
    items: ProductionMovementItem[]
  }
) {
  const pending: PendingMovement[] = input.items.map((item) => ({
    kind: 'product',
    id: item.productId,
    name: item.product.name,
    quantity: item.quantity,
    type: MOVEMENT_TYPE.PRODUCTION_OUTPUT,
    referenceId: input.productionId,
    notes: `Produção #${input.productionId} — ${item.quantity} ${item.product.unit} de ${item.product.name}`,
  }))

  for (const [supplyId, consumed] of expandConsumption(input.items)) {
    pending.push({
      kind: 'supply',
      id: supplyId,
      name: consumed.name,
      quantity: -consumed.quantity,
      type: MOVEMENT_TYPE.PRODUCTION_CONSUMPTION,
      referenceId: input.productionId,
      notes: `Produção #${input.productionId} — consumo de ${consumed.quantity} ${consumed.unit} de ${consumed.name}`,
    })
  }

  await commitMovements(tx, input.authorId, pending, {
    enforceNonNegative: true,
    formatInsufficient: ({ name, available, needed }) =>
      `Estoque insuficiente do insumo ${name}. Disponível: ${available}, necessário: ${needed}.`,
  })
}

export async function recordProductionReversal(
  tx: StockDb,
  input: {
    productionId: string
    authorId: string
    reason: string
    items: ProductionMovementItem[]
  }
) {
  const pending: PendingMovement[] = input.items.map((item) => ({
    kind: 'product',
    id: item.productId,
    name: item.product.name,
    quantity: -item.quantity,
    type: MOVEMENT_TYPE.PRODUCTION_REVERSAL,
    referenceId: input.productionId,
    notes: `Estorno da produção #${input.productionId} — ${item.quantity} ${item.product.unit} de ${item.product.name} | Motivo: ${input.reason}`,
  }))

  for (const [supplyId, returned] of expandConsumption(input.items)) {
    pending.push({
      kind: 'supply',
      id: supplyId,
      name: returned.name,
      quantity: returned.quantity,
      type: MOVEMENT_TYPE.PRODUCTION_REVERSAL,
      referenceId: input.productionId,
      notes: `Estorno da produção #${input.productionId} — devolução de ${returned.quantity} ${returned.unit} de ${returned.name}`,
    })
  }

  await commitMovements(tx, input.authorId, pending)
}

type AdjustmentItem = {
  id: string
  name: string
  unit: string
}

export async function recordAdjustment(
  tx: StockDb,
  input: {
    adjustmentId: string
    authorId: string
    itemType: ItemKind
    item: AdjustmentItem
    quantity: number
    reason: string
  }
) {
  await commitMovements(tx, input.authorId, [
    {
      kind: input.itemType,
      id: input.item.id,
      name: input.item.name,
      quantity: input.quantity,
      type: MOVEMENT_TYPE.ADJUSTMENT,
      referenceId: input.adjustmentId,
      notes: `Acerto de estoque — ${input.item.name}: ${input.quantity > 0 ? '+' : ''}${input.quantity} ${input.item.unit} | Motivo: ${input.reason}`,
    },
  ])
}

export async function recordAdjustmentReversal(
  tx: StockDb,
  input: {
    adjustmentId: string
    authorId: string
    authorName: string
    itemType: ItemKind
    item: AdjustmentItem
    quantity: number
    reason: string
  }
) {
  const reversed = -input.quantity

  await commitMovements(tx, input.authorId, [
    {
      kind: input.itemType,
      id: input.item.id,
      name: input.item.name,
      quantity: reversed,
      type: MOVEMENT_TYPE.ADJUSTMENT_REVERSAL,
      referenceId: input.adjustmentId,
      notes: `Estorno do acerto — ${input.item.name}: ${reversed > 0 ? '+' : ''}${reversed} ${input.item.unit} | Motivo: ${input.reason} | Autor: ${input.authorName}`,
    },
  ])
}
