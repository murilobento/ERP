import { isWithinRange } from '../../shared/filter-date-utils'
import { type Production } from './schema'

export type ProductionStatus = Production['status']

export const productionStatusMap: Record<ProductionStatus, { label: string }> =
  {
    draft: { label: 'Rascunho' },
    in_production: { label: 'Em Produção' },
    completed: { label: 'Concluída' },
    cancelled: { label: 'Cancelada' },
  }

export const productionStatusOptions = Object.entries(productionStatusMap).map(
  ([value, config]) => ({
    value: value as ProductionStatus,
    label: config.label,
  })
)

const validStatuses = productionStatusOptions.map((o) => o.value)

type ProductionsFilterValues = {
  filter: string
  status: ProductionStatus[]
  dateFrom: string
  dateTo: string
}

export function getProductionsFilters(
  search: Record<string, unknown>
): ProductionsFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    status: Array.isArray(search.status)
      ? (search.status.filter((v) =>
          validStatuses.includes(v)
        ) as ProductionStatus[])
      : [],
    dateFrom: typeof search.dateFrom === 'string' ? search.dateFrom : '',
    dateTo: typeof search.dateTo === 'string' ? search.dateTo : '',
  }
}

export function filterProductions(
  productions: Production[],
  search: Record<string, unknown>
) {
  const filters = getProductionsFilters(search)
  const text = filters.filter.trim().toLowerCase()

  return productions.filter((p) => {
    if (text) {
      const items = p.items?.length ? p.items : [{ product: p.product }]
      const matchesText =
        items.some((item) => item.product.name.toLowerCase().includes(text)) ||
        p.notes.toLowerCase().includes(text)
      if (!matchesText) return false
    }

    if (filters.status.length > 0 && !filters.status.includes(p.status)) {
      return false
    }

    if (!isWithinRange(p.createdAt, filters.dateFrom, filters.dateTo)) {
      return false
    }

    return true
  })
}
