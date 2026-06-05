import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/date-picker'
import { getMovementsFilters, movementTypeOptions } from '../data/filters'

type MovementsFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

type ItemType = 'product' | 'supply'

const itemTypeOptions: { value: ItemType; label: string }[] = [
  { value: 'product', label: 'Produto' },
  { value: 'supply', label: 'Insumo' },
]

type DatePreset = 'today' | 'yesterday' | 'this_month' | 'last_month'

type DatePresetOption = {
  value: DatePreset
  label: string
}

const datePresetOptions: DatePresetOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
]

function parseFilterDate(value: string) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatFilterDate(date: Date | undefined) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPresetRange(preset: DatePreset) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)

  if (preset === 'today') {
    const value = formatFilterDate(base)
    return { from: value, to: value }
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(base)
    yesterday.setDate(yesterday.getDate() - 1)
    const value = formatFilterDate(yesterday)
    return { from: value, to: value }
  }

  if (preset === 'this_month') {
    const from = new Date(base.getFullYear(), base.getMonth(), 1)
    const to = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return { from: formatFilterDate(from), to: formatFilterDate(to) }
  }

  const from = new Date(base.getFullYear(), base.getMonth() - 1, 1)
  const to = new Date(base.getFullYear(), base.getMonth(), 0)
  return { from: formatFilterDate(from), to: formatFilterDate(to) }
}

function getDatePresetLabel(from: string, to: string) {
  const preset = datePresetOptions.find((option) => {
    const range = getPresetRange(option.value)
    return from === range.from && to === range.to
  })
  return preset?.label
}

function getDateRangeLabel(from: string, to: string) {
  const presetLabel = getDatePresetLabel(from, to)
  if (presetLabel) return presetLabel
  if (from && to) return `${from} até ${to}`
  if (from) return `A partir de ${from}`
  if (to) return `Até ${to}`
  return ''
}

function getMovementTypeLabel(type: string) {
  return movementTypeOptions.find((o) => o.value === type)?.label || type
}

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

  function applyPreset(preset: DatePreset) {
    const range = getPresetRange(preset)
    updateFilter({ ...filters, dateFrom: range.from, dateTo: range.to })
  }

  function isPresetActive(preset: DatePreset, from: string, to: string) {
    const range = getPresetRange(preset)
    return from === range.from && to === range.to
  }

  return (
    <div className='grid gap-2 rounded-md border bg-muted/20 p-2'>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
        <Input
          value={filters.filter}
          onChange={(event) => setField('filter', event.target.value)}
          placeholder='Item ou observação...'
          className='h-8 min-w-0 bg-background px-2 text-sm lg:flex-1'
        />
        <div className='grid grid-cols-[1fr_auto] gap-2 sm:flex sm:justify-end'>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 justify-start bg-background px-2 text-xs sm:min-w-32 sm:justify-center'
              >
                <Filter className='size-4' />
                Filtros
                {activeFilterCount > 0 && (
                  <span className='rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground'>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
              <DialogHeader className='text-start'>
                <DialogTitle>Filtros de movimentações</DialogTitle>
                <DialogDescription>
                  Refine a listagem por tipo de item, tipo de movimento e período.
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-5'>
                <section className='grid gap-2'>
                  <div>
                    <h3 className='text-sm font-medium'>Tipo de item</h3>
                    <p className='text-xs text-muted-foreground'>
                      Filtre por produto ou insumo.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {itemTypeOptions.map((option) => {
                      const selected = filters.itemType.includes(option.value)
                      return (
                        <Button
                          key={option.value}
                          type='button'
                          variant={selected ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => toggleItemType(option.value)}
                          className={cn(
                            'h-8 px-2 text-xs',
                            !selected && 'bg-background'
                          )}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </section>

                <section className='grid gap-2 border-t pt-4'>
                  <div>
                    <h3 className='text-sm font-medium'>Tipo de movimento</h3>
                    <p className='text-xs text-muted-foreground'>
                      Selecione um ou mais tipos.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {movementTypeOptions.map((option) => {
                      const selected = filters.movementTypes.includes(option.value)
                      return (
                        <Button
                          key={option.value}
                          type='button'
                          variant={selected ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => toggleMovementType(option.value)}
                          className={cn(
                            'h-8 px-2 text-xs',
                            !selected && 'bg-background'
                          )}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </section>

                <section className='grid gap-3 border-t pt-4'>
                  <div>
                    <h3 className='text-sm font-medium'>Período</h3>
                    <p className='text-xs text-muted-foreground'>
                      Filtre por data da movimentação.
                    </p>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <DatePicker
                      selected={parseFilterDate(filters.dateFrom)}
                      onSelect={(date) =>
                        setField('dateFrom', formatFilterDate(date))
                      }
                      placeholder='De'
                      className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
                    />
                    <DatePicker
                      selected={parseFilterDate(filters.dateTo)}
                      onSelect={(date) =>
                        setField('dateTo', formatFilterDate(date))
                      }
                      placeholder='Até'
                      className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
                    />
                  </div>
                  <div className='-mx-0.5 overflow-x-auto pb-0.5'>
                    <div className='flex min-w-max gap-1 px-0.5'>
                      {datePresetOptions.map((option) => {
                        const selected = isPresetActive(
                          option.value,
                          filters.dateFrom,
                          filters.dateTo
                        )
                        return (
                          <Button
                            key={option.value}
                            type='button'
                            variant={selected ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => applyPreset(option.value)}
                            className={cn(
                              'h-7 px-2 text-[11px] whitespace-nowrap',
                              !selected && 'bg-background'
                            )}
                          >
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </section>
              </div>

              <DialogFooter className='gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={resetFilters}
                  disabled={!hasRemovableFilters}
                >
                  <X className='size-4' />
                  Redefinir
                </Button>
                <DialogClose asChild>
                  <Button type='button'>Aplicar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant='ghost'
            size='sm'
            onClick={resetFilters}
            disabled={!hasRemovableFilters}
            className='h-8 justify-center px-2 text-xs'
            title='Redefinir filtros'
          >
            <X className='size-4' />
            <span className='sr-only sm:not-sr-only'>Redefinir</span>
          </Button>
        </div>
      </div>

      {summaryItems.length > 0 && (
        <div className='flex gap-1.5 overflow-x-auto pb-0.5'>
          {summaryItems.map((item) => (
            <span
              key={item}
              className='inline-flex h-6 shrink-0 items-center rounded-md border bg-background px-2 text-xs text-muted-foreground'
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
