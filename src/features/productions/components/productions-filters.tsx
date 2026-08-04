import { type NavigateFn } from '@/hooks/use-table-url-state'
import {
  FilterShell,
  FilterSection,
  FilterDateSection,
} from '@/components/filter-shell'
import { getDateRangeLabel } from '@/features/shared/filter-date-utils'
import {
  type ProductionStatus,
  getProductionsFilters,
  productionStatusOptions,
} from '../data/filters'

type ProductionsFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ProductionsFilters({
  search,
  navigate,
}: ProductionsFiltersProps) {
  const filters = getProductionsFilters(search)
  const hasRemovableFilters =
    !!filters.filter ||
    filters.status.length > 0 ||
    !!filters.dateFrom ||
    !!filters.dateTo

  const activeFilterCount = [
    filters.status.length > 0,
    !!filters.dateFrom || !!filters.dateTo,
  ].filter(Boolean).length

  const summaryItems = [
    filters.status.length > 0
      ? `Status: ${filters.status.map((s) => productionStatusOptions.find((o) => o.value === s)?.label || s).join(', ')}`
      : undefined,
    filters.dateFrom || filters.dateTo
      ? `Período: ${getDateRangeLabel(filters.dateFrom, filters.dateTo)}`
      : undefined,
  ].filter((item): item is string => Boolean(item))

  function updateFilter(
    patch: Partial<ReturnType<typeof getProductionsFilters>>
  ) {
    const next = { ...filters, ...patch }
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: next.filter || undefined,
        status: next.status.length > 0 ? next.status : undefined,
        dateFrom: next.dateFrom || undefined,
        dateTo: next.dateTo || undefined,
      }),
    })
  }

  function setField<Key extends keyof ReturnType<typeof getProductionsFilters>>(
    key: Key,
    value: ReturnType<typeof getProductionsFilters>[Key]
  ) {
    updateFilter({ ...filters, [key]: value })
  }

  function toggleStatus(status: ProductionStatus) {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status]
    setField('status', next)
  }

  function resetFilters() {
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: undefined,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      }),
    })
  }

  return (
    <FilterShell
      searchValue={filters.filter}
      onSearchChange={(v) => setField('filter', v)}
      searchPlaceholder='Produto ou observação...'
      dialogTitle='Filtros de produções'
      dialogDescription='Refine a listagem por status e período.'
      activeFilterCount={activeFilterCount}
      hasRemovableFilters={hasRemovableFilters}
      onReset={resetFilters}
      summaryItems={summaryItems}
    >
      <FilterSection
        title='Status'
        description='Selecione um ou mais status.'
        options={productionStatusOptions}
        selected={filters.status}
        onToggle={toggleStatus}
      />
      <FilterDateSection
        title='Período'
        description='Filtre por data de criação.'
        from={filters.dateFrom}
        to={filters.dateTo}
        onFromChange={(v) => setField('dateFrom', v)}
        onToChange={(v) => setField('dateTo', v)}
      />
    </FilterShell>
  )
}
