import { Badge } from '@/components/ui/badge'
import { formatCurrency, saleStatusMap } from '@/features/sales/data/schema'

export function RecentSales({
  sales,
}: {
  sales: {
    id: string
    customer: string
    total: number
    status: string
    createdAt: string
  }[]
}) {
  if (sales.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>Nenhuma venda registrada.</p>
    )
  }

  return (
    <div className='space-y-1.5'>
      <div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[11px] font-medium text-muted-foreground sm:grid-cols-[1.5fr_1fr_1fr_auto]'>
        <span>Cliente</span>
        <span className='text-right'>Valor</span>
        <span className='text-center'>Status</span>
        <span className='text-right'>Data</span>
      </div>
      {sales.map((sale) => {
        const statusInfo =
          saleStatusMap[sale.status as keyof typeof saleStatusMap]
        const date = new Date(sale.createdAt)
        const dateStr = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })
        return (
          <div
            key={sale.id}
            className='grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 rounded-md border px-3 py-1.5 text-sm sm:grid-cols-[1.5fr_1fr_1fr_auto]'
          >
            <span className='truncate font-medium'>{sale.customer}</span>
            <span className='text-right font-medium'>
              {formatCurrency(sale.total)}
            </span>
            <span className='text-center'>
              <Badge
                variant={
                  statusInfo?.variant === 'success'
                    ? 'default'
                    : statusInfo?.variant === 'danger'
                      ? 'destructive'
                      : statusInfo?.variant === 'blue'
                        ? 'default'
                        : 'secondary'
                }
                className='text-xs'
              >
                {statusInfo?.label ?? sale.status}
              </Badge>
            </span>
            <span className='text-right text-muted-foreground'>{dateStr}</span>
          </div>
        )
      })}
    </div>
  )
}
