import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { InfoIcon, TrophyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, type Sale } from '../data/schema'
import { isWithinRange } from '../data/filters'

type BestSellingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DatePreset = 'today' | 'yesterday' | 'this_month' | 'last_month' | 'last_3_months'

type DatePresetOption = {
  value: DatePreset
  label: string
}

const datePresetOptions: DatePresetOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'last_3_months', label: 'Últimos 3 meses' },
]

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

  if (preset === 'last_month') {
    const from = new Date(base.getFullYear(), base.getMonth() - 1, 1)
    const to = new Date(base.getFullYear(), base.getMonth(), 0)
    return { from: formatFilterDate(from), to: formatFilterDate(to) }
  }

  const from = new Date(base.getFullYear(), base.getMonth() - 3, 1)
  return { from: formatFilterDate(from), to: formatFilterDate(base) }
}

function parseFilterDate(value: string) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

type AggregatedItem = {
  productId: string
  name: string
  unit: string
  totalQuantity: number
  orderCount: number
  totalRevenue: number
}

function aggregateItems(sales: Sale[]): AggregatedItem[] {
  const map = new Map<
    string,
    {
      name: string
      unit: string
      totalQuantity: number
      totalRevenue: number
      saleIds: Set<string>
    }
  >()

  for (const sale of sales) {
    for (const item of sale.items) {
      const existing = map.get(item.productId)
      if (existing) {
        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.quantity * item.unitPrice
        existing.saleIds.add(sale.id)
      } else {
        map.set(item.productId, {
          name: item.product.name,
          unit: item.product.unit,
          totalQuantity: item.quantity,
          totalRevenue: item.quantity * item.unitPrice,
          saleIds: new Set([sale.id]),
        })
      }
    }
  }

  return Array.from(map.entries())
    .map(([productId, data]) => ({
      productId,
      name: data.name,
      unit: data.unit,
      totalQuantity: data.totalQuantity,
      orderCount: data.saleIds.size,
      totalRevenue: data.totalRevenue,
    }))
    .sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity)
        return b.totalQuantity - a.totalQuantity
      return a.name.localeCompare(b.name)
    })
}

export function BestSellingDialog({
  open,
  onOpenChange,
}: BestSellingDialogProps) {
  const preset = getPresetRange('this_month')
  const [from, setFrom] = useState(preset.from)
  const [to, setTo] = useState(preset.to)

  const { data: sales = [] } = useQuery({
    queryKey: queryKeys.sales,
    queryFn: async () => {
      const res = await api.get('/sales')
      return res.data.sales as Sale[]
    },
  })

  const completedSales = useMemo(() => {
    return sales.filter(
      (sale) =>
        sale.status === 'completed' &&
        isWithinRange(sale.completedAt, from, to)
    )
  }, [sales, from, to])

  const items = useMemo(
    () => aggregateItems(completedSales),
    [completedSales]
  )

  const totalQuantity = items.reduce((sum, i) => sum + i.totalQuantity, 0)
  const totalRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0)
  const totalOrders = completedSales.length

  function applyPreset(preset: DatePreset) {
    const range = getPresetRange(preset)
    setFrom(range.from)
    setTo(range.to)
  }

  function isPresetActive(preset: DatePreset) {
    const range = getPresetRange(preset)
    return from === range.from && to === range.to
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <TrophyIcon className='size-5' />
            Produtos Mais Vendidos
          </DialogTitle>
          <DialogDescription>
            Ranking de produtos por quantidade vendida em vendas concluídas.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-3'>
          <section className='grid gap-2'>
            <div className='grid gap-2 sm:grid-cols-2'>
              <DatePicker
                selected={parseFilterDate(from)}
                onSelect={(date) => setFrom(formatFilterDate(date))}
                placeholder='Concluído de'
                className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
              />
              <DatePicker
                selected={parseFilterDate(to)}
                onSelect={(date) => setTo(formatFilterDate(date))}
                placeholder='Concluído até'
                className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
              />
            </div>
            <div className='-mx-0.5 overflow-x-auto pb-0.5'>
              <div className='flex min-w-max gap-1 px-0.5'>
                {datePresetOptions.map((option) => {
                  const selected = isPresetActive(option.value)
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

          {items.length === 0 ? (
            <div className='rounded-md border border-dashed bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground'>
              <InfoIcon className='mx-auto mb-2 size-5 text-muted-foreground/60' />
              Nenhuma venda concluída neste período.
            </div>
          ) : (
            <>
              <div className='flex gap-4 text-xs text-muted-foreground'>
                <span>
                  <strong className='text-foreground'>{totalQuantity}</strong>{' '}
                  {totalQuantity === 1 ? 'item' : 'itens'}
                </span>
                <span>
                  <strong className='text-foreground'>{totalOrders}</strong>{' '}
                  {totalOrders === 1 ? 'pedido' : 'pedidos'}
                </span>
                <span>
                  <strong className='text-foreground'>
                    {formatCurrency(totalRevenue)}
                  </strong>{' '}
                  total
                </span>
              </div>
              <div className='max-h-[24rem] overflow-y-auto rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-10'>#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className='text-right'>Qtd</TableHead>
                      <TableHead className='text-right'>Pedidos</TableHead>
                      <TableHead className='text-right'>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.productId}>
                        <TableCell className='text-muted-foreground'>
                          {index + 1}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {item.name}
                          <span className='ml-1 text-xs text-muted-foreground'>
                            ({item.unit})
                          </span>
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {item.totalQuantity}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {item.orderCount}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {formatCurrency(item.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
