import { saleStatusMap, type Sale, type SaleStatus } from './schema'

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

function getDayStart(value: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getDayEnd(value: string) {
  if (!value) return null
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isWithinRange(dateValue: string | null, from: string, to: string) {
  if (!from && !to) return true
  if (!dateValue) return false

  const date = new Date(dateValue)
  const start = getDayStart(from)
  const end = getDayEnd(to)

  if (Number.isNaN(date.getTime())) return false
  if (start && date < start) return false
  if (end && date > end) return false

  return true
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
        filters.deliveryTo,
      )
    ) {
      return false
    }

    return true
  })
}
