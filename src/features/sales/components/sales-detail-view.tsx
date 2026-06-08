import { useState } from 'react'
import {
  CheckCircle2,
  FileText,
  Loader2,
  PackageCheck,
  Pen,
  RotateCcw,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import {
  formatCurrency,
  paymentMethodMap,
  type Sale,
  saleStatusMap,
} from '../data/schema'
import { downloadInvoice } from '../lib/download-invoice'

export type SalesDetailConfirmAction =
  | 'ready-for-delivery'
  | 'deliver'
  | 'complete'
  | 'reverse'
  | null

type SalesDetailViewProps = {
  sale: Sale
  canEdit: boolean
  isLoading: boolean
  onEdit: () => void
  onConfirmAction: (action: SalesDetailConfirmAction) => void
  onClose: () => void
}

export function SalesDetailView({
  sale,
  canEdit,
  isLoading,
  onEdit,
  onConfirmAction,
  onClose,
}: SalesDetailViewProps) {
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)

  async function handleInvoice() {
    setIsInvoiceLoading(true)
    try {
      await downloadInvoice(sale.id, sale.customer)
    } finally {
      setIsInvoiceLoading(false)
    }
  }

  return (
    <>
      <div>
        <h4 className='mb-2 text-sm font-medium'>Itens</h4>
        <div className='space-y-1'>
          {sale.items.map((item) => (
            <div
              key={item.id}
              className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
            >
              <span>{item.product.name}</span>
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground'>
                  {item.quantity} {item.product.unit}
                </span>
                <span className='text-muted-foreground'>x</span>
                <span>{formatCurrency(item.unitPrice)}</span>
                <strong>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sale.deliveryDate && (
        <div>
          <h4 className='mb-1 text-sm font-medium'>Data de entrega</h4>
          <p className='text-sm text-muted-foreground'>
            {new Date(sale.deliveryDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {sale.paymentMethod && sale.paidAt && (
        <div className='rounded-md border px-3 py-2'>
          <h4 className='mb-1 text-sm font-medium'>Pagamento</h4>
          <p className='text-sm text-muted-foreground'>
            {paymentMethodMap[sale.paymentMethod] || sale.paymentMethod} ·{' '}
            {new Date(sale.paidAt).toLocaleString()}
          </p>
          {sale.paymentNotes && (
            <p className='mt-1 text-sm'>{sale.paymentNotes}</p>
          )}
        </div>
      )}

      {sale.notes && (
        <div>
          <h4 className='mb-1 text-sm font-medium'>Observação</h4>
          <p className='text-sm text-muted-foreground'>{sale.notes}</p>
        </div>
      )}

      {sale.reversedAt && (
        <div className='rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2'>
          <h4 className='mb-1 text-sm font-medium text-destructive'>Estorno</h4>
          <p className='text-sm text-muted-foreground'>
            {new Date(sale.reversedAt).toLocaleString()}
          </p>
          {sale.reversalReason && (
            <p className='mt-1 text-sm'>Motivo: {sale.reversalReason}</p>
          )}
        </div>
      )}

      <div>
        <h4 className='mb-1 text-sm font-medium'>Criada em</h4>
        <p className='text-sm text-muted-foreground'>
          {new Date(sale.createdAt).toLocaleString()}
        </p>
      </div>

      <DialogFooter className='gap-2'>
        <Button
          variant='outline'
          onClick={handleInvoice}
          disabled={isInvoiceLoading || isLoading}
        >
          {isInvoiceLoading ? (
            <Loader2 size={16} className='me-1 animate-spin' />
          ) : (
            <FileText size={16} className='me-1' />
          )}
          Fatura
        </Button>
        {canEdit && (
          <Button onClick={onEdit} disabled={isLoading}>
            <Pen size={16} className='me-1' />
            Editar
          </Button>
        )}
        {sale.status === 'in_preparation' && (
          <Button
            onClick={() => onConfirmAction('ready-for-delivery')}
            disabled={isLoading}
          >
            <Truck size={16} className='me-1' />
            Pronto para Entrega
          </Button>
        )}
        {sale.status === 'ready_for_delivery' && (
          <Button onClick={() => onConfirmAction('deliver')} disabled={isLoading}>
            <PackageCheck size={16} className='me-1' />
            Entregar
          </Button>
        )}
        {sale.status === 'delivered' && (
          <Button
            onClick={() => onConfirmAction('complete')}
            disabled={isLoading}
          >
            <CheckCircle2 size={16} className='me-1' />
            Concluir
          </Button>
        )}
        {sale.status === 'completed' && (
          <Button variant='destructive' onClick={() => onConfirmAction('reverse')}>
            <RotateCcw size={16} className='me-1' />
            Estornar
          </Button>
        )}
        <Button variant='outline' onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </>
  )
}

export function SalesStatusBadge({ sale }: { sale: Sale }) {
  const statusConfig = saleStatusMap[sale.status] || {
    label: sale.status,
    variant: 'secondary' as const,
  }

  return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
}
