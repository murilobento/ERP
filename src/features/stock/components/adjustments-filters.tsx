import { type NavigateFn } from '@/hooks/use-table-url-state'
import {
  FilterShell,
  FilterSection,
  FilterDateSection,
} from '@/components/filter-shell'
import { getDateRangeLabel } from '@/features/shared/filter-date-utils'
import { adjustmentStatusOptions, getAdjustmentsFilters } from '../data/filters'
import { type StockAdjustmentStatus } from '../data/schema'

type AdjustmentsFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

type ItemType = 'product' | 'supply'

const itemTypeOptions: { value: ItemType; label: string }[] = [
  { value: 'product', label: 'Produto' },
  { value: 'supply', label: 'Insumo' },
]

export function AdjustmentsFilters({
  search,
  navigate,
}: AdjustmentsFiltersProps) {
  const filters = getAdjustmentsFilters(search)
  const hasRemovableFilters =
    !!filters.filter ||
    filters.status.length > 0 ||
    filters.itemType.length > 0 ||
    !!filters.dateFrom ||
    !!filters.dateTo

  const activeFilterCount = [
    filters.status.length > 0,
    filters.itemType.length > 0,
    !!filters.dateFrom || !!filters.dateTo,
  ].filter(Boolean).length

  const summaryItems = [
    filters.status.length > 0
      ? `Status: ${filters.status.map((s) => adjustmentStatusOptions.find((o) => o.value === s)?.label || s).join(', ')}`
      : undefined,
    filters.itemType.length > 0
      ? `Tipo: ${filters.itemType.map((t) => (t === 'product' ? 'Produto' : 'Insumo')).join(', ')}`
      : undefined,
    filters.dateFrom || filters.dateTo
      ? `Período: ${getDateRangeLabel(filters.dateFrom, filters.dateTo)}`
      : undefined,
  ].filter((item): item is string => Boolean(item))

  function updateFilter(
    patch: Partial<ReturnType<typeof getAdjustmentsFilters>>
  ) {
    const next = { ...filters, ...patch }
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: next.filter || undefined,
        status: next.status.length > 0 ? next.status : undefined,
        itemType: next.itemType.length > 0 ? next.itemType : undefined,
        dateFrom: next.dateFrom || undefined,
        dateTo: next.dateTo || undefined,
      }),
    })
  }

  function setField<Key extends keyof ReturnType<typeof getAdjustmentsFilters>>(
    key: Key,
    value: ReturnType<typeof getAdjustmentsFilters>[Key]
  ) {
    updateFilter({ ...filters, [key]: value })
  }

  function toggleStatus(status: StockAdjustmentStatus) {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status]
    setField('status', next)
  }

  function toggleItemType(type: ItemType) {
    const next = filters.itemType.includes(type)
      ? filters.itemType.filter((t) => t !== type)
      : [...filters.itemType, type]
    setField('itemType', next)
  }

  function resetFilters() {
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: undefined,
        status: undefined,
        itemType: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      }),
    })
  }

  return (
    <FilterShell
      searchValue={filters.filter}
      onSearchChange={(v) => setField('filter', v)}
      searchPlaceholder='Item ou motivo...'
      dialogTitle='Filtros de acertos'
      dialogDescription='Refine a listagem por status, tipo de item e período.'
      activeFilterCount={activeFilterCount}
      hasRemovableFilters={hasRemovableFilters}
      onReset={resetFilters}
      summaryItems={summaryItems}
    >
      <FilterSection
        title='Status'
        description='Selecione um ou mais status.'
        options={adjustmentStatusOptions}
        selected={filters.status}
        onToggle={toggleStatus}
      />
      <FilterSection
        title='Tipo de item'
        description='Filtre por produto ou insumo.'
        options={itemTypeOptions}
        selected={filters.itemType}
        onToggle={toggleItemType}
        showBorderTop
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
