import { isWithinRange } from '../../shared/filter-date-utils'
import { saleStatusMap, type Sale, type SaleStatus } from './schema'

export { isWithinRange }

type SalesFilterValues = {
  filter: string
  status: SaleStatus[]
  payment: 'confirmed' | 'pending' | undefined
  paidFrom: string
  paidTo: string
  deliveryFrom: string
  deliveryTo: string
}

const statusOptions = Object.keys(saleStatusMap) as SaleStatus[]

function getFilters(search: Record<string, unknown>): SalesFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    status: Array.isArray(search.status)
      ? (search.status.filter((value) =>
          statusOptions.some((option) => option === value)
        ) as SaleStatus[])
      : [],
    payment:
      search.payment === 'confirmed' || search.payment === 'pending'
        ? search.payment
        : undefined,
    paidFrom: typeof search.paidFrom === 'string' ? search.paidFrom : '',
    paidTo: typeof search.paidTo === 'string' ? search.paidTo : '',
    deliveryFrom:
      typeof search.deliveryFrom === 'string' ? search.deliveryFrom : '',
    deliveryTo: typeof search.deliveryTo === 'string' ? search.deliveryTo : '',
  }
}

export function filterSales(sales: Sale[], search: Record<string, unknown>) {
  const filters = getFilters(search)
  const text = filters.filter.trim().toLowerCase()

  return sales.filter((sale) => {
    if (text) {
      const matchesText =
        sale.customer.toLowerCase().includes(text) ||
        sale.notes.toLowerCase().includes(text) ||
        sale.items.some((item) =>
          item.product.name.toLowerCase().includes(text)
        )

      if (!matchesText) return false
    }

    if (filters.status.length > 0 && !filters.status.includes(sale.status)) {
      return false
    }

    if (filters.payment === 'confirmed' && !sale.paidAt) return false
    if (filters.payment === 'pending' && sale.paidAt) return false

    if (!isWithinRange(sale.paidAt, filters.paidFrom, filters.paidTo)) {
      return false
    }

    if (
      !isWithinRange(
        sale.deliveryDate,
        filters.deliveryFrom,
        filters.deliveryTo
      )
    ) {
      return false
    }

    return true
  })
}
