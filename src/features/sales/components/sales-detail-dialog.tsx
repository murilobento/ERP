import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, getSaleTotal, type Sale } from '../data/schema'
import {
  SaleConfirmAction,
  SaleCompletePanel,
  SaleReversePanel,
} from './sale-confirm-panels'
import { SaleEditForm } from './sale-edit-form'
import {
  SalesDetailView,
  SalesStatusBadge,
  type SalesDetailConfirmAction,
} from './sales-detail-view'
import { useSales } from './sales-provider'

type SaleResponse = {
  sale: Sale
}

export function SalesDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useSales()
  const { auth } = useAuthStore()
  const { run, isLoading } = useEntityMutation()
  const [localConfirmAction, setLocalConfirmAction] =
    useState<SalesDetailConfirmAction>(null)
  const [isEditing, setIsEditing] = useState(false)
  const directAction: SalesDetailConfirmAction =
    open === 'ready-for-delivery' ||
    open === 'deliver' ||
    open === 'complete' ||
    open === 'reverse'
      ? open
      : null
  const directActionTitle: Record<
    Exclude<SalesDetailConfirmAction, null>,
    string
  > = {
    'ready-for-delivery': 'Marcar pronta para entrega',
    deliver: 'Confirmar entrega',
    complete: 'Concluir venda',
    reverse: 'Estornar venda',
  }
  const confirmAction = directAction ?? localConfirmAction
  const queryClient = useQueryClient()
  const currentRowId = currentRow?.id

  const { data: detail } = useQuery({
    queryKey: queryKeys.sale(currentRowId!),
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
  const canDelete =
    (sale.status === 'in_preparation' ||
      sale.status === 'ready_for_delivery') &&
    (auth.user?.role === 'admin' || auth.user?.role === 'manager')

  function resetActionState() {
    setLocalConfirmAction(null)
    if (directAction) {
      setOpen(null)
      setCurrentRow(null)
    }
  }

  function exitEditMode() {
    setIsEditing(false)
  }

  function syncSale(updatedSale: Sale) {
    queryClient.setQueryData<Sale[]>(queryKeys.sales, (old) =>
      old?.map((item) => (item.id === updatedSale.id ? updatedSale : item))
    )
    queryClient.setQueryData<Sale>(queryKeys.sale(updatedSale.id), updatedSale)
    setCurrentRow(updatedSale)
  }

  async function postAction(path: string, payload?: Record<string, unknown>) {
    const messages: Record<string, string> = {
      'ready-for-delivery': 'Venda marcada como pronta para entrega.',
      deliver: 'Venda entregue. Estoque atualizado.',
      complete: 'Venda concluída.',
      reverse: 'Estorno realizado. Produtos devolvidos ao estoque.',
    }
    await run({
      mutation: async () => {
        const { data } = await api.post<SaleResponse>(
          `/sales/${sale.id}/${path}`,
          payload
        )
        syncSale(data.sale)
      },
      invalidate: [
        queryKeys.sales,
        queryKeys.sale(sale.id),
        ...(path === 'deliver' || path === 'reverse'
          ? [queryKeys.stock.balances, queryKeys.stock.movements]
          : []),
      ],
      successMessage: messages[path],
      onSuccess: () => {
        resetActionState()
        setOpen(null)
        setCurrentRow(null)
      },
    })
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

    await run({
      mutation: async () => {
        const { data } = await api.patch<SaleResponse>(`/sales/${sale.id}`, {
          clientId: editData.clientId,
          notes: editData.notes,
          deliveryDate: deliveryDateStr,
          items: editData.items,
        })
        syncSale(data.sale)
      },
      invalidate: [queryKeys.sales, queryKeys.sale(sale.id)],
      successMessage: 'Venda atualizada com sucesso.',
      onSuccess: () => exitEditMode(),
    })
  }

  function requestDelete() {
    resetActionState()
    exitEditMode()
    setOpen('delete')
  }

  function handleClose(state: boolean) {
    if (!state) {
      resetActionState()
      exitEditMode()
      setOpen(null)
      const closingSaleId = currentRow?.id
      if (closingSaleId) {
        setTimeout(() => {
          setCurrentRow((sale) => (sale?.id === closingSaleId ? null : sale))
        }, 300)
      }
    }
  }

  return (
    <Dialog
      open={open === 'view' || directAction !== null}
      onOpenChange={handleClose}
    >
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>
              {isEditing
                ? 'Editar Venda'
                : directAction
                  ? directActionTitle[directAction]
                  : 'Detalhes da Venda'}
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
              canDelete={canDelete}
              isLoading={isLoading}
              onEdit={() => setIsEditing(true)}
              onDelete={requestDelete}
              onConfirmAction={setLocalConfirmAction}
              onClose={() => handleClose(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
