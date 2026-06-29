import { Badge } from '@/components/ui/badge'
import {
  type StockMovementReference,
  stockAdjustmentStatusMap,
} from '../data/schema'
import { saleStatusMap } from '@/features/sales/data/schema'
import { purchaseStatusMap } from '@/features/purchases/data/schema'

const productionStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' }> = {
  in_production: { label: 'Em Produção', variant: 'default' },
  completed: { label: 'Concluída', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function ReferenceHoverContent({ reference }: { reference: StockMovementReference }) {
  switch (reference.type) {
    case 'sale': {
      const d = reference.data
      return (
        <div className='space-y-1.5'>
          <div className='text-sm font-semibold'>Venda</div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>ID</span>
            <span className='font-mono text-xs'>{d.id}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Cliente</span>
            <span className='font-medium'>{d.customer}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Status</span>
            <Badge variant={saleStatusMap[d.status as keyof typeof saleStatusMap]?.variant ?? 'secondary'} className='text-xs'>
              {saleStatusMap[d.status as keyof typeof saleStatusMap]?.label ?? d.status}
            </Badge>
          </div>
          <div className='mt-1.5 border-t pt-1.5 space-y-1'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Criada em</span>
              <span>{formatDate(d.createdAt)}</span>
            </div>
            {d.deliveryDate && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Previsão entrega</span>
                <span>{formatDate(d.deliveryDate)}</span>
              </div>
            )}
            {d.deliveredAt && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Entregue em</span>
                <span>{formatDate(d.deliveredAt)}</span>
              </div>
            )}
            {d.completedAt && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Concluída em</span>
                <span>{formatDate(d.completedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'purchase': {
      const d = reference.data
      return (
        <div className='space-y-1.5'>
          <div className='text-sm font-semibold'>Compra</div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>ID</span>
            <span className='font-mono text-xs'>{d.id}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Fornecedor</span>
            <span className='font-medium'>{d.supplier}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Status</span>
            <Badge variant={purchaseStatusMap[d.status as keyof typeof purchaseStatusMap]?.variant ?? 'secondary'} className='text-xs'>
              {purchaseStatusMap[d.status as keyof typeof purchaseStatusMap]?.label ?? d.status}
            </Badge>
          </div>
          <div className='mt-1.5 border-t pt-1.5 space-y-1'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Criada em</span>
              <span>{formatDate(d.createdAt)}</span>
            </div>
            {d.completedAt && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Concluída em</span>
                <span>{formatDate(d.completedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'production': {
      const d = reference.data
      return (
        <div className='space-y-1.5'>
          <div className='text-sm font-semibold'>Produção</div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>ID</span>
            <span className='font-mono text-xs'>{d.id}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Produto</span>
            <span className='font-medium'>{d.product.name}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Quantidade</span>
            <span className='font-medium'>{d.quantity} {d.product.unit}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Status</span>
            <Badge variant={productionStatusMap[d.status]?.variant ?? 'secondary'} className='text-xs'>
              {productionStatusMap[d.status]?.label ?? d.status}
            </Badge>
          </div>
          <div className='mt-1.5 border-t pt-1.5 space-y-1'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Criada em</span>
              <span>{formatDate(d.createdAt)}</span>
            </div>
            {d.completedAt && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Concluída em</span>
                <span>{formatDate(d.completedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'adjustment': {
      const d = reference.data
      return (
        <div className='space-y-1.5'>
          <div className='text-sm font-semibold'>Ajuste de Estoque</div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>ID</span>
            <span className='font-mono text-xs'>{d.id}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Motivo</span>
            <span className='font-medium'>{d.reason}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Status</span>
            <Badge variant={stockAdjustmentStatusMap[d.status as keyof typeof stockAdjustmentStatusMap]?.variant ?? 'secondary'} className='text-xs'>
              {stockAdjustmentStatusMap[d.status as keyof typeof stockAdjustmentStatusMap]?.label ?? d.status}
            </Badge>
          </div>
          <div className='mt-1.5 border-t pt-1.5 space-y-1'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Criado em</span>
              <span>{formatDate(d.createdAt)}</span>
            </div>
            {d.completedAt && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Concluído em</span>
                <span>{formatDate(d.completedAt)}</span>
              </div>
            )}
            {d.reversedAt && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Estornado em</span>
                <span>{formatDate(d.reversedAt)}</span>
              </div>
            )}
            {d.reversalReason && (
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Motivo estorno</span>
                <span>{d.reversalReason}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
  }
}
