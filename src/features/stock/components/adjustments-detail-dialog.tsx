import { useState } from 'react'
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type StockAdjustment, stockAdjustmentStatusMap } from '../data/schema'
import { useAdjustments } from './adjustments-provider'

type AdjustmentResponse = {
  adjustment: StockAdjustment
}

export function AdjustmentsDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useAdjustments()
  const [isLoading, setIsLoading] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [showReverse, setShowReverse] = useState(false)
  const [reverseReason, setReverseReason] = useState('')
  const queryClient = useQueryClient()
  const currentRowId = currentRow?.id

  const { data: detail } = useQuery({
    queryKey: ['stock-adjustment', currentRowId],
    queryFn: async () => {
      const res = await api.get<AdjustmentResponse>(`/stock/adjustments/${currentRowId}`)
      return res.data.adjustment
    },
    enabled: open === 'view' && !!currentRowId,
  })

  const adjustment = detail || currentRow

  function handleClose() {
    setOpen(null)
    setCurrentRow(null)
    setConfirmComplete(false)
    setShowReverse(false)
    setReverseReason('')
  }

  async function handleComplete() {
    if (!adjustment) return
    setIsLoading(true)
    try {
      await api.post(`/stock/adjustments/${adjustment.id}/complete`)
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Acerto concluído com sucesso.')
      handleClose()
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReverse() {
    if (!adjustment || !reverseReason.trim()) return
    setIsLoading(true)
    try {
      await api.post(`/stock/adjustments/${adjustment.id}/reverse`, {
        reason: reverseReason.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Acerto estornado com sucesso.')
      handleClose()
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const itemName = adjustment?.product?.name || adjustment?.supply?.name || '—'
  const itemUnit = adjustment?.product?.unit || adjustment?.supply?.unit || ''
  const status = adjustment?.status as StockAdjustment['status']
  const statusConfig = status ? stockAdjustmentStatusMap[status] : null

  return (
    <Dialog open={open === 'view'} onOpenChange={(state) => { if (!state) handleClose() }}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Detalhes do Acerto</DialogTitle>
          <DialogDescription>
            Informações do acerto de estoque.
          </DialogDescription>
        </DialogHeader>

        {adjustment && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <Label className='text-muted-foreground'>Item</Label>
                <p className='font-medium'>{itemName}</p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Tipo</Label>
                <p className='font-medium'>
                  {adjustment.itemType === 'product' ? 'Produto' : 'Insumo'}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Quantidade</Label>
                <p className={`font-medium ${adjustment.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity} {itemUnit}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Status</Label>
                <div className='mt-0.5'>
                  {statusConfig && (
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  )}
                </div>
              </div>
              <div className='col-span-2'>
                <Label className='text-muted-foreground'>Motivo</Label>
                <p className='font-medium'>{adjustment.reason || '—'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Autor</Label>
                <p className='font-medium'>
                  {adjustment.author
                    ? `${adjustment.author.firstName} ${adjustment.author.lastName}`
                    : '—'}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Criado em</Label>
                <p className='font-medium'>
                  {new Date(adjustment.createdAt).toLocaleDateString()}
                </p>
              </div>
              {adjustment.completedAt && (
                <>
                  <div>
                    <Label className='text-muted-foreground'>Concluído em</Label>
                    <p className='font-medium'>
                      {new Date(adjustment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground'>Concluído por</Label>
                    <p className='font-medium'>
                      {adjustment.completedBy
                        ? `${adjustment.completedBy.firstName} ${adjustment.completedBy.lastName}`
                        : '—'}
                    </p>
                  </div>
                </>
              )}
              {adjustment.reversedAt && (
                <>
                  <div>
                    <Label className='text-muted-foreground'>Estornado em</Label>
                    <p className='font-medium'>
                      {new Date(adjustment.reversedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground'>Estornado por</Label>
                    <p className='font-medium'>
                      {adjustment.reversedBy
                        ? `${adjustment.reversedBy.firstName} ${adjustment.reversedBy.lastName}`
                        : '—'}
                    </p>
                  </div>
                  <div className='col-span-2'>
                    <Label className='text-muted-foreground'>Motivo do estorno</Label>
                    <p className='font-medium'>{adjustment.reversalReason || '—'}</p>
                  </div>
                </>
              )}
            </div>

            {adjustment.status === 'pending' && !confirmComplete && (
              <div className='flex justify-end gap-2'>
                <Button
                  onClick={() => setConfirmComplete(true)}
                  disabled={isLoading}
                >
                  <CheckCircle2 size={16} />
                  Concluir Acerto
                </Button>
              </div>
            )}

            {adjustment.status === 'pending' && confirmComplete && (
              <div className='rounded-md border bg-muted/40 p-3 space-y-3'>
                <p className='text-sm font-medium'>
                  Confirmar conclusão do acerto? O estoque será atualizado.
                </p>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setConfirmComplete(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleComplete} disabled={isLoading}>
                    {isLoading && <Loader2 className='animate-spin' />}
                    Confirmar
                  </Button>
                </div>
              </div>
            )}

            {adjustment.status === 'completed' && !showReverse && (
              <div className='flex justify-end'>
                <Button
                  variant='destructive'
                  onClick={() => setShowReverse(true)}
                  disabled={isLoading}
                >
                  <RotateCcw size={16} />
                  Estornar
                </Button>
              </div>
            )}

            {adjustment.status === 'completed' && showReverse && (
              <div className='rounded-md border bg-destructive/10 p-3 space-y-3'>
                <Label htmlFor='reverse-reason'>Motivo do estorno</Label>
                <Input
                  id='reverse-reason'
                  placeholder='Informe o motivo do estorno...'
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                />
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowReverse(false)
                      setReverseReason('')
                    }}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={handleReverse}
                    disabled={isLoading || !reverseReason.trim()}
                  >
                    {isLoading && <Loader2 className='animate-spin' />}
                    Confirmar Estorno
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
