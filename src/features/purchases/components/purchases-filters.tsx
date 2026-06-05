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

const statusOptions = Object.entries(purchaseStatusMap).map(([value, config]) => ({
  value: value as PurchaseStatus,
  label: config.label,
}))

type DatePreset =
  | 'today'
  | 'tomorrow'
  | 'yesterday'
  | 'this_month'
  | 'last_month'

type DatePresetOption = {
  value: DatePreset
  label: string
}

const datePresetOptions: DatePresetOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
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

  if (preset === 'tomorrow') {
    const tomorrow = new Date(base)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const value = formatFilterDate(tomorrow)
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

  function applyPreset(preset: DatePreset) {
    const range = getPresetRange(preset)
    updateFilter({
      ...filters,
      completedFrom: range.from,
      completedTo: range.to,
    })
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
          placeholder='Fornecedor, insumo ou observação...'
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
                <DialogTitle>Filtros de compras</DialogTitle>
                <DialogDescription>
                  Refine a listagem por status e data de conclusão.
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-5'>
                <section className='grid gap-2'>
                  <div>
                    <h3 className='text-sm font-medium'>Status</h3>
                    <p className='text-xs text-muted-foreground'>
                      Selecione uma ou mais etapas da compra.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {statusOptions.map((option) => {
                      const selected = filters.status.includes(option.value)
                      return (
                        <Button
                          key={option.value}
                          type='button'
                          variant={selected ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => toggleStatus(option.value)}
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
                    <h3 className='text-sm font-medium'>Concluída em</h3>
                    <p className='text-xs text-muted-foreground'>
                      A página abre com conclusão de hoje por padrão.
                    </p>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <DatePicker
                      selected={parseFilterDate(filters.completedFrom)}
                      onSelect={(date) =>
                        setField('completedFrom', formatFilterDate(date))
                      }
                      placeholder='De'
                      className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
                    />
                    <DatePicker
                      selected={parseFilterDate(filters.completedTo)}
                      onSelect={(date) =>
                        setField('completedTo', formatFilterDate(date))
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
                          filters.completedFrom,
                          filters.completedTo
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
