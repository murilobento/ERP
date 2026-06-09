import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import api from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatCurrency,
  getSaleTotal,
  type Sale,
} from '../data/schema'
import {
  SalesDetailView,
  SalesStatusBadge,
  type SalesDetailConfirmAction,
} from './sales-detail-view'
import { SaleEditForm } from './sale-edit-form'
import {
  SaleConfirmAction,
  SaleCompletePanel,
  SaleReversePanel,
} from './sale-confirm-panels'
import { useSales } from './sales-provider'

type SaleResponse = {
  sale: Sale
}

export function SalesDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useSales()
  const [isLoading, setIsLoading] = useState(false)
  const [confirmAction, setConfirmAction] =
    useState<SalesDetailConfirmAction>(null)
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()
  const currentRowId = currentRow?.id

  const { data: detail } = useQuery({
    queryKey: ['sale', currentRowId],
    queryFn: async () => {
      const res = await api.get<SaleResponse>(`/sales/${currentRowId}`)
      return res.data.sale
    },
    enabled: open === 'view' && !!currentRow,
    staleTime: 0,
  })

  if (!currentRow) return null

  const sale = detail ?? currentRow
  const total = getSaleTotal(sale)
  const canEdit = sale.status !== 'completed'

  function resetActionState() {
    setConfirmAction(null)
  }

  function exitEditMode() {
    setIsEditing(false)
  }

  function syncSale(updatedSale: Sale) {
    queryClient.setQueryData<Sale[]>(['sales'], (old) =>
      old?.map((item) => (item.id === updatedSale.id ? updatedSale : item))
    )
    queryClient.setQueryData<Sale>(['sale', updatedSale.id], updatedSale)
    setCurrentRow(updatedSale)
  }

  async function postAction(path: string, payload?: Record<string, unknown>) {
    setIsLoading(true)
    try {
      const { data } = await api.post<SaleResponse>(
        `/sales/${sale.id}/${path}`,
        payload
      )
      syncSale(data.sale)
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale', sale.id] })
      if (path === 'deliver' || path === 'reverse') {
        queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      }
      const messages: Record<string, string> = {
        'ready-for-delivery': 'Venda marcada como pronta para entrega.',
        deliver: 'Venda entregue. Estoque atualizado.',
        complete: 'Venda concluída.',
        reverse: 'Estorno realizado. Produtos devolvidos ao estoque.',
      }
      toast.success(messages[path])
      resetActionState()
      setOpen(null)
      setCurrentRow(null)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveEdit(editData: {
    clientId: string
    notes: string
    deliveryDate: Date | undefined
    items: { productId: string; quantity: number; unitPrice: number }[]
  }) {
    if (!editData.deliveryDate) return
    const year = editData.deliveryDate.getFullYear()
    const month = String(editData.deliveryDate.getMonth() + 1).padStart(2, '0')
    const day = String(editData.deliveryDate.getDate()).padStart(2, '0')
    const deliveryDateStr = `${year}-${month}-${day}`

    setIsLoading(true)
    try {
      const { data } = await api.patch<SaleResponse>(`/sales/${sale.id}`, {
        clientId: editData.clientId,
        notes: editData.notes,
        deliveryDate: deliveryDateStr,
        items: editData.items,
      })
      syncSale(data.sale)
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale', sale.id] })
      toast.success('Venda atualizada com sucesso.')
      exitEditMode()
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose(state: boolean) {
    if (!state) {
      resetActionState()
      exitEditMode()
      setOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
    }
  }

  return (
    <Dialog open={open === 'view'} onOpenChange={handleClose}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>
              {isEditing ? 'Editar Venda' : 'Detalhes da Venda'}
            </DialogTitle>
            <SalesStatusBadge sale={sale} />
          </div>
          <DialogDescription>
            Cliente: <strong>{sale.customer}</strong> · Total:{' '}
            <strong>{formatCurrency(total)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isEditing && (
            <SaleEditForm
              sale={sale}
              isLoading={isLoading}
              onSave={saveEdit}
              onCancel={exitEditMode}
            />
          )}

          {!isEditing &&
            confirmAction &&
            confirmAction !== 'complete' &&
            confirmAction !== 'reverse' && (
              <SaleConfirmAction
                action={confirmAction}
                isLoading={isLoading}
                onConfirm={(action) => postAction(action)}
                onBack={resetActionState}
              />
            )}

          {!isEditing && confirmAction === 'complete' && (
            <SaleCompletePanel
              isLoading={isLoading}
              onComplete={(data) =>
                postAction('complete', {
                  paymentMethod: data.paymentMethod,
                  paidAt: data.paidAt,
                  paymentNotes: data.paymentNotes,
                })
              }
              onCancel={resetActionState}
            />
          )}

          {!isEditing && confirmAction === 'reverse' && (
            <SaleReversePanel
              isLoading={isLoading}
              onReverse={(reason) => postAction('reverse', { reason })}
              onCancel={resetActionState}
            />
          )}

          {!isEditing && !confirmAction && (
            <SalesDetailView
              sale={sale}
              canEdit={canEdit}
              isLoading={isLoading}
              onEdit={() => setIsEditing(true)}
              onConfirmAction={setConfirmAction}
              onClose={() => handleClose(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
