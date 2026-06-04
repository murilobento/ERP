import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { InfoIcon, PackageIcon } from 'lucide-react'
import api from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { StockBalance } from '@/features/stock/data/schema'
import type { Sale } from '../data/schema'

type PreparationSummaryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  preparationSales: Sale[]
}

type AggregatedItem = {
  productId: string
  name: string
  totalQuantity: number
  orderCount: number
}

function aggregateItems(sales: Sale[]): AggregatedItem[] {
  const map = new Map<
    string,
    { name: string; totalQuantity: number; saleIds: Set<string> }
  >()

  for (const sale of sales) {
    for (const item of sale.items) {
      const existing = map.get(item.productId)
      if (existing) {
        existing.totalQuantity += item.quantity
        existing.saleIds.add(sale.id)
      } else {
        map.set(item.productId, {
          name: item.product.name,
          totalQuantity: item.quantity,
          saleIds: new Set([sale.id]),
        })
      }
    }
  }

  return Array.from(map.entries())
    .map(([productId, data]) => ({
      productId,
      name: data.name,
      totalQuantity: data.totalQuantity,
      orderCount: data.saleIds.size,
    }))
    .sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      return a.name.localeCompare(b.name)
    })
}

export function PreparationSummaryDialog({
  open,
  onOpenChange,
  preparationSales,
}: PreparationSummaryDialogProps) {
  const { data: balancesData } = useQuery({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const res = await api.get('/stock/balances')
      return res.data.balances as StockBalance[]
    },
    enabled: open,
  })

  const stockMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!balancesData) return map
    for (const balance of balancesData) {
      if (balance.type === 'product') {
        map.set(balance.id, balance.stock)
      }
    }
    return map
  }, [balancesData])

  const items = useMemo(() => aggregateItems(preparationSales), [preparationSales])

  const totalItems = items.reduce((sum, item) => sum + item.totalQuantity, 0)
  const totalOrders = preparationSales.length
  const itemLabel = totalItems === 1 ? 'item' : 'itens'
  const orderLabel = totalOrders === 1 ? 'pedido' : 'pedidos'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <PackageIcon className='size-5' />
            Produtos em preparo
          </DialogTitle>
          <DialogDescription>
            {totalItems > 0 || totalOrders > 0
              ? `${totalItems} ${itemLabel} • ${totalOrders} ${orderLabel} em preparo`
              : 'Nenhum produto em preparo neste período.'}
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className='rounded-md border border-dashed bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground'>
            <InfoIcon className='mx-auto mb-2 size-5 text-muted-foreground/60' />
            Nenhum produto em preparo neste período.
          </div>
        ) : (
          <div className='max-h-[24rem] overflow-y-auto'>
            <ul className='space-y-1'>
              {items.map((item) => {
                const stock = stockMap.get(item.productId)
                return (
                  <li
                    key={item.productId}
                    className='flex items-center gap-2 rounded-md px-2.5 py-2 text-sm'
                  >
                    <span className='shrink-0 font-semibold tabular-nums'>
                      {item.totalQuantity}x
                    </span>
                    <span className='min-w-0 truncate'>{item.name}</span>
                    {stock !== undefined && (
                      <span className='ml-auto shrink-0 text-muted-foreground'>
                        Est: {stock}
                      </span>
                    )}
                    {item.orderCount > 1 && (
                      <span className='shrink-0 text-xs text-muted-foreground'>
                        ({item.orderCount} pedidos)
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
