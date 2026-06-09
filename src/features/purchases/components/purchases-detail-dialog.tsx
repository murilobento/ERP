import { useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  Pen,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { type Purchase, purchaseStatusMap } from '../data/schema'
import { usePurchases } from './purchases-provider'
import { PurchaseEditForm } from './purchase-edit-form'

type PurchaseResponse = {
  purchase: Purchase
}

export function PurchasesDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = usePurchases()
  const [isLoading, setIsLoading] = useState(false)
  const [showReverse, setShowReverse] = useState(false)
  const [reverseReason, setReverseReason] = useState('')
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()
  const currentRowId = currentRow?.id

  const { data: detail } = useQuery({
    queryKey: ['purchase', currentRowId],
    queryFn: async () => {
      const res = await api.get<PurchaseResponse>(`/purchases/${currentRowId}`)
      return res.data.purchase
    },
    enabled: open === 'view' && !!currentRow,
    staleTime: 0,
  })

  if (!currentRow) return null

  const purchase = detail ?? currentRow
  const statusConfig = purchaseStatusMap[purchase.status] || { label: purchase.status, variant: 'secondary' as const }
  const canEdit = purchase.status === 'pending'

  function syncPurchase(updatedPurchase: Purchase) {
    queryClient.setQueryData<Purchase[]>(['purchases'], (old) =>
      old?.map((item) =>
        item.id === updatedPurchase.id ? updatedPurchase : item
      )
    )
    queryClient.setQueryData<Purchase>(
      ['purchase', updatedPurchase.id],
      updatedPurchase
    )
    setCurrentRow(updatedPurchase)
  }

  async function saveEdit(editData: {
    vendorId: string
    notes: string
    items: { supplyId: string; packages: number; packageCost: number }[]
  }) {
    setIsLoading(true)
    try {
      const { data } = await api.patch<PurchaseResponse>(
        `/purchases/${purchase.id}`,
        editData
      )
      syncPurchase(data.purchase)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', purchase.id] })
      toast.success('Compra atualizada com sucesso.')
      setIsEditing(false)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleComplete() {
    if (!currentRow) return
    setIsLoading(true)
    try {
      const { data } = await api.post<PurchaseResponse>(
        `/purchases/${currentRow.id}/complete`
      )
      syncPurchase(data.purchase)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', currentRow.id] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Compra concluída. Estoque atualizado.')
      setConfirmComplete(false)
      setOpen(null)
      setCurrentRow(null)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReverse() {
    if (!currentRow || !reverseReason.trim()) return
    setIsLoading(true)
    try {
      const { data } = await api.post<PurchaseResponse>(
        `/purchases/${currentRow.id}/reverse`,
        { reason: reverseReason.trim() }
      )
      syncPurchase(data.purchase)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', currentRow.id] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Estorno realizado. Estoque revertido.')
      setShowReverse(false)
      setReverseReason('')
      setConfirmComplete(false)
      setOpen(null)
      setCurrentRow(null)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose(state: boolean) {
    if (!state) {
      setShowReverse(false)
      setReverseReason('')
      setConfirmComplete(false)
      setIsEditing(false)
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
              {isEditing ? 'Editar Compra' : 'Detalhes da Compra'}
            </DialogTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <DialogDescription>
            Fornecedor: <strong>{purchase.supplier}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isEditing && (
            <PurchaseEditForm
              purchase={purchase}
              isLoading={isLoading}
              onSave={saveEdit}
              onCancel={() => setIsEditing(false)}
            />
          )}

          {!isEditing && confirmComplete && (
            <>
              <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
                <p className='font-medium text-green-600 dark:text-green-400'>Confirmar conclusão da compra?</p>
                <p className='mt-1 text-muted-foreground'>O estoque dos insumos será atualizado. Esta ação não pode ser desfeita.</p>
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setConfirmComplete(false)} disabled={isLoading}>
                  Voltar
                </Button>
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <CheckCircle2 size={16} className='me-1' />}
                  Confirmar Conclusão
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing && showReverse && (
            <>
              <div className='rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm'>
                <p className='font-medium text-destructive'>Confirmar estorno da compra?</p>
                <p className='mt-1 text-muted-foreground'>O estoque será revertido e a compra voltará para pendente.</p>
              </div>
              <div className='space-y-2 rounded-md border border-destructive/50 p-3'>
                <Label className='text-sm font-medium text-destructive'>Motivo do Estorno *</Label>
                <Input
                  placeholder='Informe o motivo do estorno...'
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => { setShowReverse(false); setReverseReason('') }} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button variant='destructive' onClick={handleReverse} disabled={isLoading || !reverseReason.trim()}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <RotateCcw size={16} className='me-1' />}
                  Confirmar Estorno
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing && !confirmComplete && !showReverse && (
            <>
              <div>
                <h4 className='mb-2 text-sm font-medium'>Itens</h4>
                <div className='space-y-1'>
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                    >
                      <span>{item.supply.name}</span>
                      <div className='flex items-center gap-2'>
                        {item.packageCost > 0 && (
                          <>
                            <span className='text-muted-foreground'>
                              R$ {item.packageCost.toFixed(2)}/{item.supply.packageUnit || 'emb.'}
                            </span>
                            <span className='text-muted-foreground'>·</span>
                          </>
                        )}
                        <span className='text-muted-foreground'>
                          {item.packages} {item.supply.packageUnit || 'emb.'}(s)
                        </span>
                        <span className='text-muted-foreground'>=</span>
                        <strong>{item.quantity} {item.supply.unit}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {purchase.notes && (
                <div>
                  <h4 className='mb-1 text-sm font-medium'>Observação</h4>
                  <p className='text-sm text-muted-foreground'>{purchase.notes}</p>
                </div>
              )}

              {purchase.reversedAt && (
                <div className='rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2'>
                  <h4 className='mb-1 text-sm font-medium text-destructive'>Estorno</h4>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(purchase.reversedAt).toLocaleString()}
                  </p>
                  {purchase.reversalReason && (
                    <p className='mt-1 text-sm'>Motivo: {purchase.reversalReason}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className='mb-1 text-sm font-medium'>Criada em</h4>
                <p className='text-sm text-muted-foreground'>
                  {new Date(purchase.createdAt).toLocaleString()}
                </p>
              </div>

              {purchase.completedAt && (
                <div>
                  <h4 className='mb-1 text-sm font-medium'>Concluída em</h4>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(purchase.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <DialogFooter className='gap-2'>
                {canEdit && (
                  <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
                    <Pen size={16} className='me-1' />
                    Editar
                  </Button>
                )}
                {purchase.status === 'pending' && (
                  <>
                    <Button onClick={() => setConfirmComplete(true)} disabled={isLoading}>
                      {isLoading ? <Loader2 className='animate-spin' /> : <CheckCircle2 size={16} className='me-1' />}
                      Concluir
                    </Button>
                    <Button variant='outline' onClick={() => setOpen(null)}>
                      Fechar
                    </Button>
                  </>
                )}
                {purchase.status === 'completed' && (
                  <>
                    <Button variant='destructive' onClick={() => setShowReverse(true)}>
                      <RotateCcw size={16} className='me-1' />
                      Estornar
                    </Button>
                    <Button variant='outline' onClick={() => setOpen(null)}>
                      Fechar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
