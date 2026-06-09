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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { saleStatusMap, type SaleStatus } from '../data/schema'
import {
  type DatePreset,
  datePresetOptions,
  parseFilterDate,
  formatFilterDate,
  getPresetRange,
  getDateRangeLabel,
  isPresetActive,
} from '@/features/shared/filter-date-utils'

type SalesFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

type SalesFilterValues = {
  filter: string
  status: SaleStatus[]
  payment: 'confirmed' | 'pending' | undefined
  paidFrom: string
  paidTo: string
  deliveryFrom: string
  deliveryTo: string
}

const statusOptions = Object.entries(saleStatusMap).map(([value, config]) => ({
  value: value as SaleStatus,
  label: config.label,
}))

function getFilters(search: Record<string, unknown>): SalesFilterValues {
  return {
    filter: typeof search.filter === 'string' ? search.filter : '',
    status: Array.isArray(search.status)
      ? (search.status.filter((value) =>
          statusOptions.some((option) => option.value === value)
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

export function SalesFilters({ search, navigate }: SalesFiltersProps) {
  const filters = getFilters(search)
  const todayRange = getPresetRange('today')
  const deliveryIsDefault =
    filters.deliveryFrom === todayRange.from &&
    filters.deliveryTo === todayRange.to
  const hasRemovableFilters =
    !!filters.filter ||
    filters.status.length > 0 ||
    !!filters.payment ||
    !!filters.paidFrom ||
    !!filters.paidTo ||
    !deliveryIsDefault
  const activeFilterCount = [
    filters.status.length > 0,
    !!filters.payment,
    !!filters.deliveryFrom || !!filters.deliveryTo,
    !!filters.paidFrom || !!filters.paidTo,
  ].filter(Boolean).length
  const summaryItems = [
    filters.status.length > 0 ? `Status: ${filters.status.length}` : undefined,
    filters.payment === 'confirmed'
      ? 'Pagamento confirmado'
      : filters.payment === 'pending'
        ? 'Pagamento pendente'
        : undefined,
    filters.deliveryFrom || filters.deliveryTo
      ? `Entrega: ${getDateRangeLabel(filters.deliveryFrom, filters.deliveryTo)}`
      : undefined,
    filters.paidFrom || filters.paidTo
      ? `Pago: ${getDateRangeLabel(filters.paidFrom, filters.paidTo)}`
      : undefined,
  ].filter((item): item is string => Boolean(item))

  function updateFilter(patch: Partial<SalesFilterValues>) {
    const next = { ...filters, ...patch }

    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: next.filter || undefined,
        status: next.status.length > 0 ? next.status : undefined,
        payment: next.payment || undefined,
        paidFrom: next.paidFrom || undefined,
        paidTo: next.paidTo || undefined,
        deliveryFrom: next.deliveryFrom || undefined,
        deliveryTo: next.deliveryTo || undefined,
      }),
    })
  }

  function setField<Key extends keyof SalesFilterValues>(
    key: Key,
    value: SalesFilterValues[Key]
  ) {
    updateFilter({ ...filters, [key]: value })
  }

  function toggleStatus(status: SaleStatus) {
    const next = filters.status.includes(status)
      ? filters.status.filter((item) => item !== status)
      : [...filters.status, status]

    setField('status', next)
  }

  function resetFilters() {
    const defaultDelivery = getPresetRange('today')

    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: undefined,
        status: undefined,
        payment: undefined,
        paidFrom: undefined,
        paidTo: undefined,
        deliveryFrom: defaultDelivery.from,
        deliveryTo: defaultDelivery.to,
      }),
    })
  }

  function applyPreset(
    preset: DatePreset,
    fromKey: 'deliveryFrom' | 'paidFrom',
    toKey: 'deliveryTo' | 'paidTo'
  ) {
    const range = getPresetRange(preset)
    updateFilter({ ...filters, [fromKey]: range.from, [toKey]: range.to })
  }

  return (
    <div className='grid gap-2 rounded-md border bg-muted/20 p-2'>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
        <Input
          value={filters.filter}
          onChange={(event) => setField('filter', event.target.value)}
          placeholder='Cliente, produto ou observação...'
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
                <DialogTitle>Filtros de vendas</DialogTitle>
                <DialogDescription>
                  Refine a listagem por status, pagamento, entrega e data de
                  pagamento.
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-5'>
                <section className='grid gap-2'>
                  <div>
                    <h3 className='text-sm font-medium'>Status</h3>
                    <p className='text-xs text-muted-foreground'>
                      Selecione uma ou mais etapas da venda.
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

                <section className='grid gap-2 border-t pt-4'>
                  <div>
                    <h3 className='text-sm font-medium'>Pagamento</h3>
                    <p className='text-xs text-muted-foreground'>
                      Filtre vendas pagas ou pendentes.
                    </p>
                  </div>
                  <Select
                    value={filters.payment || 'all'}
                    onValueChange={(value) =>
                      setField(
                        'payment',
                        value === 'all'
                          ? undefined
                          : (value as 'confirmed' | 'pending')
                      )
                    }
                  >
                    <SelectTrigger className='h-8 w-full bg-background px-2 text-sm sm:w-56'>
                      <SelectValue placeholder='Pagamento' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos</SelectItem>
                      <SelectItem value='confirmed'>
                        Pagamento confirmado
                      </SelectItem>
                      <SelectItem value='pending'>
                        Pagamento pendente
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </section>

                <section className='grid gap-3 border-t pt-4'>
                  <div>
                    <h3 className='text-sm font-medium'>Entrega</h3>
                    <p className='text-xs text-muted-foreground'>
                      A página abre com entrega de hoje por padrão.
                    </p>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <DatePicker
                      selected={parseFilterDate(filters.deliveryFrom)}
                      onSelect={(date) =>
                        setField('deliveryFrom', formatFilterDate(date))
                      }
                      placeholder='De'
                      className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
                    />
                    <DatePicker
                      selected={parseFilterDate(filters.deliveryTo)}
                      onSelect={(date) =>
                        setField('deliveryTo', formatFilterDate(date))
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
                          filters.deliveryFrom,
                          filters.deliveryTo
                        )
                        return (
                          <Button
                            key={option.value}
                            type='button'
                            variant={selected ? 'default' : 'outline'}
                            size='sm'
                            onClick={() =>
                              applyPreset(
                                option.value,
                                'deliveryFrom',
                                'deliveryTo'
                              )
                            }
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

                <section className='grid gap-3 border-t pt-4'>
                  <div>
                    <h3 className='text-sm font-medium'>Pago em</h3>
                    <p className='text-xs text-muted-foreground'>
                      Use quando precisar conferir recebimentos por período.
                    </p>
                  </div>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <DatePicker
                      selected={parseFilterDate(filters.paidFrom)}
                      onSelect={(date) =>
                        setField('paidFrom', formatFilterDate(date))
                      }
                      placeholder='De'
                      className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
                    />
                    <DatePicker
                      selected={parseFilterDate(filters.paidTo)}
                      onSelect={(date) =>
                        setField('paidTo', formatFilterDate(date))
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
                          filters.paidFrom,
                          filters.paidTo
                        )
                        return (
                          <Button
                            key={`paid-${option.value}`}
                            type='button'
                            variant={selected ? 'default' : 'outline'}
                            size='sm'
                            onClick={() =>
                              applyPreset(option.value, 'paidFrom', 'paidTo')
                            }
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
