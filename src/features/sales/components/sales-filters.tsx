import { X } from 'lucide-react'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saleStatusMap, type SaleStatus } from '../data/schema'

type SalesFiltersProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

type SalesFilterValues = {
  filter: string
  status: SaleStatus[]
  payment: 'confirmed' | 'pending' | undefined
  createdFrom: string
  createdTo: string
  paidFrom: string
  paidTo: string
  deliveryFrom: string
  deliveryTo: string
}

const statusOptions = Object.entries(saleStatusMap).map(([value, config]) => ({
  value: value as SaleStatus,
  label: config.label,
}))

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
    createdFrom:
      typeof search.createdFrom === 'string' ? search.createdFrom : '',
    createdTo: typeof search.createdTo === 'string' ? search.createdTo : '',
    paidFrom: typeof search.paidFrom === 'string' ? search.paidFrom : '',
    paidTo: typeof search.paidTo === 'string' ? search.paidTo : '',
    deliveryFrom:
      typeof search.deliveryFrom === 'string' ? search.deliveryFrom : '',
    deliveryTo: typeof search.deliveryTo === 'string' ? search.deliveryTo : '',
  }
}

export function SalesFilters({ search, navigate }: SalesFiltersProps) {
  const filters = getFilters(search)
  const hasFilters =
    !!filters.filter ||
    filters.status.length > 0 ||
    !!filters.payment ||
    !!filters.createdFrom ||
    !!filters.createdTo ||
    !!filters.paidFrom ||
    !!filters.paidTo ||
    !!filters.deliveryFrom ||
    !!filters.deliveryTo

  function updateFilter(patch: Partial<SalesFilterValues>) {
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: patch.filter !== undefined ? patch.filter || undefined : undefined,
        status:
          patch.status !== undefined
            ? patch.status.length > 0
              ? patch.status
              : undefined
            : undefined,
        payment:
          patch.payment !== undefined ? patch.payment || undefined : undefined,
        createdFrom:
          patch.createdFrom !== undefined
            ? patch.createdFrom || undefined
            : undefined,
        createdTo:
          patch.createdTo !== undefined ? patch.createdTo || undefined : undefined,
        paidFrom:
          patch.paidFrom !== undefined ? patch.paidFrom || undefined : undefined,
        paidTo: patch.paidTo !== undefined ? patch.paidTo || undefined : undefined,
        deliveryFrom:
          patch.deliveryFrom !== undefined
            ? patch.deliveryFrom || undefined
            : undefined,
        deliveryTo:
          patch.deliveryTo !== undefined
            ? patch.deliveryTo || undefined
            : undefined,
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
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        filter: undefined,
        status: undefined,
        payment: undefined,
        createdFrom: undefined,
        createdTo: undefined,
        paidFrom: undefined,
        paidTo: undefined,
        deliveryFrom: undefined,
        deliveryTo: undefined,
      }),
    })
  }

  return (
    <div className='grid gap-2 rounded-md border bg-muted/20 p-2'>
      <div className='grid gap-2 xl:grid-cols-[minmax(16rem,1fr)_auto_auto_auto]'>
        <Input
          value={filters.filter}
          onChange={(event) => setField('filter', event.target.value)}
          placeholder='Cliente, produto ou observação...'
          className='h-8 min-w-0 bg-background px-2 text-sm'
        />
        <div className='flex flex-wrap gap-1'>
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
        <Select
          value={filters.payment || 'all'}
          onValueChange={(value) =>
            setField(
              'payment',
              value === 'all' ? undefined : (value as 'confirmed' | 'pending')
            )
          }
        >
          <SelectTrigger className='h-8 w-full bg-background px-2 text-sm xl:w-40'>
            <SelectValue placeholder='Pagamento' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            <SelectItem value='confirmed'>Pagamento confirmado</SelectItem>
            <SelectItem value='pending'>Pagamento pendente</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant='ghost'
          size='sm'
          onClick={resetFilters}
          disabled={!hasFilters}
          className='h-8 justify-start px-2 text-xs xl:justify-center'
          title='Redefinir filtros'
        >
          <X className='size-4' />
          <span className='xl:sr-only'>Redefinir</span>
        </Button>
      </div>

      <div className='grid gap-2 lg:grid-cols-3'>
        <div className='grid grid-cols-[3.25rem_minmax(8.75rem,1fr)_minmax(8.75rem,1fr)] items-center gap-1.5'>
          <span className='text-xs font-medium text-muted-foreground'>
            Criado
          </span>
          <DatePicker
            selected={parseFilterDate(filters.createdFrom)}
            onSelect={(date) => setField('createdFrom', formatFilterDate(date))}
            placeholder='De'
            className='h-8 w-full min-w-0 bg-background px-2 text-sm'
          />
          <DatePicker
            selected={parseFilterDate(filters.createdTo)}
            onSelect={(date) => setField('createdTo', formatFilterDate(date))}
            placeholder='Até'
            className='h-8 w-full min-w-0 bg-background px-2 text-sm'
          />
        </div>
        <div className='grid grid-cols-[3.25rem_minmax(8.75rem,1fr)_minmax(8.75rem,1fr)] items-center gap-1.5'>
          <span className='text-xs font-medium text-muted-foreground'>
            Entrega
          </span>
          <DatePicker
            selected={parseFilterDate(filters.deliveryFrom)}
            onSelect={(date) => setField('deliveryFrom', formatFilterDate(date))}
            placeholder='De'
            className='h-8 w-full min-w-0 bg-background px-2 text-sm'
          />
          <DatePicker
            selected={parseFilterDate(filters.deliveryTo)}
            onSelect={(date) => setField('deliveryTo', formatFilterDate(date))}
            placeholder='Até'
            className='h-8 w-full min-w-0 bg-background px-2 text-sm'
          />
        </div>
        <div className='grid grid-cols-[3.25rem_minmax(8.75rem,1fr)_minmax(8.75rem,1fr)] items-center gap-1.5'>
          <span className='text-xs font-medium text-muted-foreground'>
            Pago
          </span>
          <DatePicker
            selected={parseFilterDate(filters.paidFrom)}
            onSelect={(date) => setField('paidFrom', formatFilterDate(date))}
            placeholder='De'
            className='h-8 w-full min-w-0 bg-background px-2 text-sm'
          />
          <DatePicker
            selected={parseFilterDate(filters.paidTo)}
            onSelect={(date) => setField('paidTo', formatFilterDate(date))}
            placeholder='Até'
            className='h-8 w-full min-w-0 bg-background px-2 text-sm'
          />
        </div>
      </div>
    </div>
  )
}
