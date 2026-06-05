import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  formatCurrency,
  getSaleTotal,
  saleStatusMap,
  type Sale,
  type SaleStatus,
} from '../data/schema'
import { useSales } from './sales-provider'
import { PreparationSummaryDialog } from './preparation-summary-dialog'

const statusOrder: SaleStatus[] = [
  'in_preparation',
  'ready_for_delivery',
  'delivered',
  'completed',
]

type SalesKanbanProps = {
  data: Sale[]
  preparationSales: Sale[]
}

const allowedDrops: Record<SaleStatus, SaleStatus> = {
  in_preparation: 'ready_for_delivery',
  ready_for_delivery: 'delivered',
  delivered: 'completed',
  completed: 'in_preparation',
}

function formatDeliveryDate(value: string | null) {
  if (!value) return 'Sem entrega'
  return new Date(value).toLocaleDateString('pt-BR')
}

function getItemCountLabel(count: number) {
  return `${count} ${count === 1 ? 'item' : 'itens'}`
}

export function SalesKanban({ data, preparationSales }: SalesKanbanProps) {
  const { setOpen, setCurrentRow, setKanbanAction } = useSales()
  const isMobile = useIsMobile()
  const [draggedSaleId, setDraggedSaleId] = useState<string | null>(null)
  const [preparationDialogOpen, setPreparationDialogOpen] = useState(false)
  const draggedSale = draggedSaleId
    ? data.find((sale) => sale.id === draggedSaleId)
    : null
  const salesByStatus = useMemo(
    () =>
      statusOrder.reduce(
        (acc, status) => {
          acc[status] = data.filter((sale) => sale.status === status)
          return acc
        },
        {} as Record<SaleStatus, Sale[]>
      ),
    [data]
  )

  function canDrop(targetStatus: SaleStatus) {
    return draggedSale
      ? allowedDrops[draggedSale.status] === targetStatus
      : false
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
    <div className='min-w-0 flex-1 pb-2 md:overflow-x-auto'>
      <div className='grid grid-cols-1 gap-2 md:min-w-[56rem] md:grid-cols-4'>
        {statusOrder.map((status) => {
          const sales = salesByStatus[status]
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
                'min-h-0 overflow-hidden rounded-md border bg-muted/30 transition-colors md:min-h-[320px]',
                validDrop && 'border-primary/70 bg-primary/5',
                invalidDrop && 'opacity-70'
              )}
            >
              <div className='flex min-h-10 items-center justify-between border-b px-2.5 py-2'>
                <div className='flex min-w-0 items-center gap-2'>
                  <Badge
                    variant={config.variant}
                    className='shrink-0 px-2 py-0.5 text-[11px]'
                  >
                    {config.label}
                  </Badge>
                  <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-background px-1.5 text-xs text-muted-foreground'>
                    {sales.length}
                  </span>
                  {status === 'in_preparation' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          aria-label='Ver produtos em preparo'
                          className='inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreparationDialogOpen(true)
                          }}
                        >
                          <InfoIcon className='size-3.5' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Ver produtos em preparo</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className='space-y-2 p-2'>
                {sales.length === 0 ? (
                  <div className='rounded-md border border-dashed bg-background/60 px-2 py-5 text-center text-xs text-muted-foreground'>
                    Nenhuma venda.
                  </div>
                ) : (
                  sales.map((sale) => (
                    <button
                      key={sale.id}
                      type='button'
                      draggable={!isMobile}
                      className='w-full rounded-md border bg-background px-2.5 py-2.5 text-start shadow-xs transition-[border-color,background-color,box-shadow] hover:border-primary/40 hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'
                      onDragStart={(event) => {
                        if (isMobile) return
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
                      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
                        <span className='min-w-0 truncate text-sm leading-5 font-medium'>
                          {sale.customer}
                        </span>
                        <span className='shrink-0 text-sm leading-5 font-semibold'>
                          {formatCurrency(getSaleTotal(sale))}
                        </span>
                      </div>
                      <div className='mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4 text-muted-foreground'>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className='cursor-default text-primary'>
                              {getItemCountLabel(sale.items.length)}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className='w-auto min-w-72 p-3'>
                            <div className='space-y-1.5'>
                              {sale.items.map((item, i) => (
                                <div
                                  key={i}
                                  className='flex items-center justify-between text-sm'
                                >
                                  <span className='text-muted-foreground'>
                                    {item.product.name}
                                  </span>
                                  <span className='font-medium'>
                                    {item.quantity} {item.product.unit} ×{' '}
                                    {formatCurrency(item.unitPrice)}
                                  </span>
                                </div>
                              ))}
                              <div className='mt-1.5 border-t pt-1.5 flex items-center justify-between text-sm font-semibold'>
                                <span>Total</span>
                                <span>{formatCurrency(getSaleTotal(sale))}</span>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <Badge variant='outline' className='text-[11px] px-1.5 py-0'>
                          Entrega {formatDeliveryDate(sale.deliveryDate)}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
      <PreparationSummaryDialog
        open={preparationDialogOpen}
        onOpenChange={setPreparationDialogOpen}
        preparationSales={preparationSales}
      />
    </div>
  )
}
