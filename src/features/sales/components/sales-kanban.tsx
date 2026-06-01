import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  getSaleTotal,
  saleStatusMap,
  type Sale,
  type SaleStatus,
} from '../data/schema'
import { useSales } from './sales-provider'

const statusOrder: SaleStatus[] = [
  'in_preparation',
  'ready_for_delivery',
  'delivered',
  'completed',
]

type SalesKanbanProps = {
  data: Sale[]
}

const allowedDrops: Record<SaleStatus, SaleStatus> = {
  in_preparation: 'ready_for_delivery',
  ready_for_delivery: 'delivered',
  delivered: 'completed',
  completed: 'in_preparation',
}

export function SalesKanban({ data }: SalesKanbanProps) {
  const { setOpen, setCurrentRow, setKanbanAction } = useSales()
  const [draggedSaleId, setDraggedSaleId] = useState<string | null>(null)
  const draggedSale = draggedSaleId
    ? data.find((sale) => sale.id === draggedSaleId)
    : null

  function canDrop(targetStatus: SaleStatus) {
    return draggedSale ? allowedDrops[draggedSale.status] === targetStatus : false
  }

  function handleDrop(targetStatus: SaleStatus) {
    if (!draggedSale) return

    if (draggedSale.status === targetStatus) {
      setDraggedSaleId(null)
      return
    }

    if (!canDrop(targetStatus)) {
      toast.error('Movimento inválido para esta etapa.')
      setDraggedSaleId(null)
      return
    }

    setKanbanAction({ sale: draggedSale, targetStatus })
    setDraggedSaleId(null)
  }

  return (
    <div className='min-w-0 flex-1 overflow-x-auto pb-2'>
      <div className='grid min-w-[40rem] grid-cols-4 gap-2'>
        {statusOrder.map((status) => {
          const sales = data.filter((sale) => sale.status === status)
          const config = saleStatusMap[status]
          const validDrop = canDrop(status)
          const invalidDrop =
            !!draggedSale && draggedSale.status !== status && !validDrop

          return (
            <section
              key={status}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = validDrop ? 'move' : 'none'
              }}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(status)
              }}
              className={cn(
                'min-h-[300px] rounded-md border bg-muted/30 transition-colors',
                validDrop && 'border-primary/70 bg-primary/5',
                invalidDrop && 'opacity-70'
              )}
            >
              <div className='flex items-center justify-between border-b px-2 py-1.5'>
                <div className='flex min-w-0 items-center gap-1.5'>
                  <Badge
                    variant={config.variant}
                    className='shrink-0 px-2 py-0.5 text-[11px]'
                  >
                    {config.label}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {sales.length}
                  </span>
                </div>
              </div>
              <div className='space-y-1.5 p-1.5'>
                {sales.length === 0 ? (
                  <div className='rounded-md border border-dashed bg-background/60 px-2 py-4 text-center text-xs text-muted-foreground'>
                    Nenhuma venda.
                  </div>
                ) : (
                  sales.map((sale) => (
                    <button
                      key={sale.id}
                      type='button'
                      draggable
                      className='w-full rounded-md border bg-background px-2 py-2 text-start shadow-xs transition-colors hover:bg-muted'
                      onDragStart={(event) => {
                        setDraggedSaleId(sale.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', sale.id)
                      }}
                      onDragEnd={() => setDraggedSaleId(null)}
                      onClick={() => {
                        setCurrentRow(sale)
                        setOpen('view')
                      }}
                    >
                      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5'>
                        <span className='truncate text-sm font-medium'>
                          {sale.customer}
                        </span>
                        <span className='shrink-0 text-xs font-semibold'>
                          {formatCurrency(getSaleTotal(sale))}
                        </span>
                      </div>
                      <div className='mt-0.5 text-[11px] leading-4 text-muted-foreground'>
                        <span>
                          {sale.items.length}{' '}
                          {sale.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
