import { isWithinRange } from '../../shared/filter-date-utils'
import {
  type StockAdjustment,
  type StockAdjustmentStatus,
  stockAdjustmentStatusMap,
  type StockMovement,
} from './schema'

type MovementType = string

type MovementsFilterValues = {
  filter: string
  itemType: ('product' | 'supply')[]
  movementTypes: MovementType[]
  dateFrom: string
  dateTo: string
}

type AdjustmentsFilterValues = {
  filter: string
  status: StockAdjustmentStatus[]
  itemType: ('product' | 'supply')[]
  dateFrom: string
  dateTo: string
}

export const movementTypeOptions: { value: string; label: string }[] = [
  { value: 'production_output', label: 'Produção de Produto' },
  { value: 'production_consumption', label: 'Consumo na Produção' },
  { value: 'production_reversal', label: 'Estorno de Produção' },
  { value: 'purchase', label: 'Compra' },
  { value: 'purchase_reversal', label: 'Estorno de Compra' },
  { value: 'sale_delivery', label: 'Entrega de Venda' },
  { value: 'sale_reversal', label: 'Estorno de Venda' },
  { value: 'adjustment', label: 'Ajuste Manual' },
  { value: 'adjustment_reversal', label: 'Estorno de Ajuste' },
]

export const adjustmentStatusOptions = Object.entries(
  stockAdjustmentStatusMap
).map(([value, config]) => ({
  value: value as StockAdjustmentStatus,
  label: config.label,
}))

const validMovementTypes = movementTypeOptions.map((o) => o.value)
const validAdjustmentStatuses = adjustmentStatusOptions.map((o) => o.value)

export function getMovementsFilters(
  search: Record<string, unknown>
): MovementsFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    itemType: Array.isArray(search.itemType)
      ? (search.itemType.filter((v) => v === 'product' || v === 'supply') as (
          | 'product'
          | 'supply'
        )[])
      : [],
    movementTypes: Array.isArray(search.movementTypes)
      ? (search.movementTypes.filter((v) =>
          validMovementTypes.includes(v)
        ) as MovementType[])
      : [],
    dateFrom: typeof search.dateFrom === 'string' ? search.dateFrom : '',
    dateTo: typeof search.dateTo === 'string' ? search.dateTo : '',
  }
}

export function filterMovements(
  movements: StockMovement[],
  search: Record<string, unknown>
) {
  const filters = getMovementsFilters(search)
  const text = filters.filter.trim().toLowerCase()

  return movements.filter((m) => {
    if (text) {
      const itemName = m.product?.name || m.supply?.name || ''
      const matchesText =
        itemName.toLowerCase().includes(text) ||
        m.notes.toLowerCase().includes(text)
      if (!matchesText) return false
    }

    if (filters.itemType.length > 0) {
      const type: 'product' | 'supply' = m.productId ? 'product' : 'supply'
      if (!filters.itemType.includes(type)) return false
    }

    if (
      filters.movementTypes.length > 0 &&
      !filters.movementTypes.includes(m.type)
    ) {
      return false
    }

    if (!isWithinRange(m.createdAt, filters.dateFrom, filters.dateTo)) {
      return false
    }

    return true
  })
}

export function getAdjustmentsFilters(
  search: Record<string, unknown>
): AdjustmentsFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    status: Array.isArray(search.status)
      ? (search.status.filter((v) =>
          validAdjustmentStatuses.includes(v)
        ) as StockAdjustmentStatus[])
      : [],
    itemType: Array.isArray(search.itemType)
      ? (search.itemType.filter((v) => v === 'product' || v === 'supply') as (
          | 'product'
          | 'supply'
        )[])
      : [],
    dateFrom: typeof search.dateFrom === 'string' ? search.dateFrom : '',
    dateTo: typeof search.dateTo === 'string' ? search.dateTo : '',
  }
}

export function filterAdjustments(
  adjustments: StockAdjustment[],
  search: Record<string, unknown>
) {
  const filters = getAdjustmentsFilters(search)
  const text = filters.filter.trim().toLowerCase()

  return adjustments.filter((a) => {
    if (text) {
      const itemName = a.product?.name || a.supply?.name || ''
      const matchesText =
        itemName.toLowerCase().includes(text) ||
        a.reason.toLowerCase().includes(text)
      if (!matchesText) return false
    }

    if (filters.status.length > 0 && !filters.status.includes(a.status)) {
      return false
    }

    if (filters.itemType.length > 0 && !filters.itemType.includes(a.itemType)) {
      return false
    }

    if (!isWithinRange(a.createdAt, filters.dateFrom, filters.dateTo)) {
      return false
    }

    return true
  })
}
