import { isWithinRange } from '../../shared/filter-date-utils'
import { purchaseStatusMap, type Purchase, type PurchaseStatus } from './schema'

export { isWithinRange }

type PurchasesFilterValues = {
  filter: string
  status: PurchaseStatus[]
  completedFrom: string
  completedTo: string
}

const statusOptions = Object.keys(purchaseStatusMap) as PurchaseStatus[]

function getFilters(search: Record<string, unknown>): PurchasesFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    status: Array.isArray(search.status)
      ? (search.status.filter((value) =>
          statusOptions.some((option) => option === value)
        ) as PurchaseStatus[])
      : [],
    completedFrom:
      typeof search.completedFrom === 'string' ? search.completedFrom : '',
    completedTo:
      typeof search.completedTo === 'string' ? search.completedTo : '',
  }
}

export function filterPurchases(
  purchases: Purchase[],
  search: Record<string, unknown>
) {
  const filters = getFilters(search)
  const text = filters.filter.trim().toLowerCase()

  return purchases.filter((purchase) => {
    if (text) {
      const matchesText =
        purchase.supplier.toLowerCase().includes(text) ||
        purchase.notes.toLowerCase().includes(text) ||
        purchase.items.some((item) =>
          item.supply.name.toLowerCase().includes(text)
        )

      if (!matchesText) return false
    }

    if (
      filters.status.length > 0 &&
      !filters.status.includes(purchase.status)
    ) {
      return false
    }

    if (
      !isWithinRange(
        purchase.completedAt,
        filters.completedFrom,
        filters.completedTo
      )
    ) {
      return false
    }

    return true
  })
}
