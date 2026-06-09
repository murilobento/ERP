import { type NavigateFn } from '@/hooks/use-table-url-state'
import { getMovementsFilters, movementTypeOptions } from '../data/filters'
import { getDateRangeLabel } from '@/features/shared/filter-date-utils'
import {
  FilterShell,
  FilterSection,
  FilterDateSection,
} from '@/components/filter-shell'

type MovementsFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

type ItemType = 'product' | 'supply'

const itemTypeOptions: { value: ItemType; label: string }[] = [
  { value: 'product', label: 'Produto' },
  { value: 'supply', label: 'Insumo' },
]

export function StockMovementsFilters({ search, navigate }: MovementsFiltersProps) {
  const filters = getMovementsFilters(search)
  const hasRemovableFilters =
    !!filters.filter ||
    filters.itemType.length > 0 ||
    filters.movementTypes.length > 0 ||
    !!filters.dateFrom ||
    !!filters.dateTo

  const activeFilterCount = [
    filters.itemType.length > 0,
    filters.movementTypes.length > 0,
    !!filters.dateFrom || !!filters.dateTo,
  ].filter(Boolean).length

  const summaryItems = [
    filters.itemType.length > 0
      ? `Tipo: ${filters.itemType.map((t) => (t === 'product' ? 'Produto' : 'Insumo')).join(', ')}`
      : undefined,
    filters.movementTypes.length > 0
      ? `Movimento: ${filters.movementTypes.length} tipo${filters.movementTypes.length > 1 ? 's' : ''}`
      : undefined,
    filters.dateFrom || filters.dateTo
      ? `Período: ${getDateRangeLabel(filters.dateFrom, filters.dateTo)}`
      : undefined,
  ].filter((item): item is string => Boolean(item))

  function updateFilter(patch: Partial<ReturnType<typeof getMovementsFilters>>) {
    const next = { ...filters, ...patch }
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: next.filter || undefined,
        itemType: next.itemType.length > 0 ? next.itemType : undefined,
        movementTypes: next.movementTypes.length > 0 ? next.movementTypes : undefined,
        dateFrom: next.dateFrom || undefined,
        dateTo: next.dateTo || undefined,
      }),
    })
  }

  function setField<Key extends keyof ReturnType<typeof getMovementsFilters>>(
    key: Key,
    value: ReturnType<typeof getMovementsFilters>[Key]
  ) {
    updateFilter({ ...filters, [key]: value })
  }

  function toggleItemType(type: ItemType) {
    const next = filters.itemType.includes(type)
      ? filters.itemType.filter((t) => t !== type)
      : [...filters.itemType, type]
    setField('itemType', next)
  }

  function toggleMovementType(type: string) {
    const next = filters.movementTypes.includes(type)
      ? filters.movementTypes.filter((t) => t !== type)
      : [...filters.movementTypes, type]
    setField('movementTypes', next)
  }

  function resetFilters() {
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: undefined,
        itemType: undefined,
        movementTypes: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      }),
    })
  }

  return (
    <FilterShell
      searchValue={filters.filter}
      onSearchChange={(v) => setField('filter', v)}
      searchPlaceholder='Item ou observação...'
      dialogTitle='Filtros de movimentações'
      dialogDescription='Refine a listagem por tipo de item, tipo de movimento e período.'
      activeFilterCount={activeFilterCount}
      hasRemovableFilters={hasRemovableFilters}
      onReset={resetFilters}
      summaryItems={summaryItems}
    >
      <FilterSection
        title='Tipo de item'
        description='Filtre por produto ou insumo.'
        options={itemTypeOptions}
        selected={filters.itemType}
        onToggle={toggleItemType}
      />
      <FilterSection
        title='Tipo de movimento'
        description='Selecione um ou mais tipos.'
        options={movementTypeOptions}
        selected={filters.movementTypes}
        onToggle={toggleMovementType}
        showBorderTop
      />
      <FilterDateSection
        title='Período'
        description='Filtre por data da movimentação.'
        from={filters.dateFrom}
        to={filters.dateTo}
        onFromChange={(v) => setField('dateFrom', v)}
        onToChange={(v) => setField('dateTo', v)}
      />
    </FilterShell>
  )
}
