import { type NavigateFn } from '@/hooks/use-table-url-state'
import {
  FilterShell,
  FilterSection,
  FilterDateSection,
} from '@/components/filter-shell'
import {
  datePresetOptions,
  getDateRangeLabel,
} from '@/features/shared/filter-date-utils'
import { purchaseStatusMap, type PurchaseStatus } from '../data/schema'

type PurchasesFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

type PurchasesFilterValues = {
  filter: string
  status: PurchaseStatus[]
  completedFrom: string
  completedTo: string
}

const statusOptions = Object.entries(purchaseStatusMap).map(
  ([value, config]) => ({
    value: value as PurchaseStatus,
    label: config.label,
  })
)

function getFilters(search: Record<string, unknown>): PurchasesFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    status: Array.isArray(search.status)
      ? (search.status.filter((value) =>
          statusOptions.some((option) => option.value === value)
        ) as PurchaseStatus[])
      : [],
    completedFrom:
      typeof search.completedFrom === 'string' ? search.completedFrom : '',
    completedTo:
      typeof search.completedTo === 'string' ? search.completedTo : '',
  }
}

export function PurchasesFilters({ search, navigate }: PurchasesFiltersProps) {
  const filters = getFilters(search)
  const hasRemovableFilters =
    !!filters.filter ||
    filters.status.length > 0 ||
    !!filters.completedFrom ||
    !!filters.completedTo
  const activeFilterCount = [
    filters.status.length > 0,
    !!filters.completedFrom || !!filters.completedTo,
  ].filter(Boolean).length
  const summaryItems = [
    filters.status.length > 0 ? `Status: ${filters.status.length}` : undefined,
    filters.completedFrom || filters.completedTo
      ? `Concluída: ${getDateRangeLabel(filters.completedFrom, filters.completedTo)}`
      : undefined,
  ].filter((item): item is string => Boolean(item))

  function updateFilter(patch: Partial<PurchasesFilterValues>) {
    const next = { ...filters, ...patch }
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: next.filter || undefined,
        status: next.status.length > 0 ? next.status : undefined,
        completedFrom: next.completedFrom || undefined,
        completedTo: next.completedTo || undefined,
      }),
    })
  }

  function setField<Key extends keyof PurchasesFilterValues>(
    key: Key,
    value: PurchasesFilterValues[Key]
  ) {
    updateFilter({ ...filters, [key]: value })
  }

  function toggleStatus(status: PurchaseStatus) {
    const next = filters.status.includes(status)
      ? filters.status.filter((item) => item !== status)
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
        completedFrom: undefined,
        completedTo: undefined,
      }),
    })
  }

  return (
    <FilterShell
      searchValue={filters.filter}
      onSearchChange={(v) => setField('filter', v)}
      searchPlaceholder='Fornecedor, insumo ou observação...'
      dialogTitle='Filtros de compras'
      dialogDescription='Refine a listagem por status e data de conclusão.'
      activeFilterCount={activeFilterCount}
      hasRemovableFilters={hasRemovableFilters}
      onReset={resetFilters}
      summaryItems={summaryItems}
    >
      <FilterSection
        title='Status'
        description='Selecione uma ou mais etapas da compra.'
        options={statusOptions}
        selected={filters.status}
        onToggle={toggleStatus}
      />
      <FilterDateSection
        title='Concluída em'
        description='A página abre com conclusão de hoje por padrão.'
        from={filters.completedFrom}
        to={filters.completedTo}
        onFromChange={(v) => setField('completedFrom', v)}
        onToChange={(v) => setField('completedTo', v)}
        presets={datePresetOptions}
      />
    </FilterShell>
  )
}
