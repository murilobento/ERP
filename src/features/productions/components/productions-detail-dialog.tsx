import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { queryKeys } from '@/lib/query-keys'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type CompositionNeeded,
  type Production,
  type ProductionDetail,
} from '../data/schema'
import { useProductions } from './productions-provider'

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' }> = {
  in_production: { label: 'Em Produção', variant: 'default' },
  completed: { label: 'Concluída', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

type ProductionDetailResponse = {
  production: ProductionDetail
  compositionNeeded: CompositionNeeded[]
}

type ProductionActionResponse = {
  production: Production
}

function getProductionItems(production: Production | ProductionDetail) {
  return production.items?.length
    ? production.items
    : [
        {
          id: production.id,
          productId: production.productId,
          quantity: production.quantity,
          product: production.product,
        },
      ]
}

export function ProductionsDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useProductions()
  const { run, isLoading } = useEntityMutation()
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | 'reverse' | null>(null)
  const [reverseReason, setReverseReason] = useState('')
  const queryClient = useQueryClient()

  const { data: detail } = useQuery({
    queryKey: queryKeys.production(currentRow?.id ?? ''),
    queryFn: async () => {
      const res = await api.get(`/productions/${currentRow?.id}`)
      return res.data as ProductionDetailResponse
    },
    enabled: open === 'view' && !!currentRow,
    staleTime: 0,
  })

  const production = detail?.production
  const productionForDisplay = production || currentRow
  const productionItems = productionForDisplay
    ? getProductionItems(productionForDisplay)
    : []
  const compositionNeeded = detail?.compositionNeeded || []
  const status = production?.status || currentRow?.status || 'in_production'
  const statusConfig = statusMap[status] || { label: status, variant: 'secondary' as const }

  function syncProduction(updatedProduction: Production) {
    queryClient.setQueryData<Production[]>(queryKeys.productions, (old) =>
      old?.map((item) =>
        item.id === updatedProduction.id ? updatedProduction : item
      )
    )

    queryClient.setQueryData<ProductionDetailResponse>(
      queryKeys.production(updatedProduction.id),
      (old) => {
        if (!old) return old

        return {
          ...old,
          production: {
            ...old.production,
            ...updatedProduction,
            product: {
              ...old.production.product,
              ...updatedProduction.product,
            },
            items: old.production.items,
          },
        }
      }
    )

    setCurrentRow(updatedProduction)
  }

  async function handleAction(action: 'complete' | 'cancel') {
    if (!currentRow) return
    const messages: Record<string, string> = {
      complete: 'Produção concluída. Estoque atualizado.',
      cancel: 'Produção cancelada.',
    }
    await run({
      mutation: async () => {
        const { data } = await api.post<ProductionActionResponse>(
          `/productions/${currentRow.id}/${action}`
        )
        syncProduction(data.production)
      },
      invalidate: [
        queryKeys.productions,
        queryKeys.production(currentRow.id),
        ...(action === 'complete'
          ? [queryKeys.stock.balances, queryKeys.stock.movements]
          : []),
      ],
      successMessage: messages[action],
      onSuccess: () => {
        setConfirmAction(null)
        setOpen(null)
        setCurrentRow(null)
      },
    })
  }

  async function handleReverse() {
    if (!currentRow || !reverseReason.trim()) return
    await run({
      mutation: async () => {
        const { data } = await api.post<ProductionActionResponse>(
          `/productions/${currentRow.id}/reverse`,
          { reason: reverseReason.trim() }
        )
        syncProduction(data.production)
      },
      invalidate: [
        queryKeys.productions,
        queryKeys.production(currentRow.id),
        queryKeys.stock.balances,
        queryKeys.stock.movements,
      ],
      successMessage: 'Estorno realizado. Estoque revertido.',
      onSuccess: () => {
        setConfirmAction(null)
        setReverseReason('')
        setOpen(null)
        setCurrentRow(null)
      },
    })
  }

  return (
    <Dialog
      open={open === 'view'}
      onOpenChange={(state) => {
        if (!state) {
          setConfirmAction(null)
          setReverseReason('')
          setOpen(null)
          setTimeout(() => setCurrentRow(null), 300)
        }
      }}
    >
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>Detalhes da Produção</DialogTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <DialogDescription>
            {productionItems.length} {productionItems.length === 1 ? 'item' : 'itens'} na ordem
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {confirmAction === 'complete' && (
            <>
              <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
                <p className='font-medium text-green-600 dark:text-green-400'>Confirmar conclusão da produção?</p>
                <p className='mt-1 text-muted-foreground'>O estoque do produto será atualizado e os insumos serão descontados. Esta ação não pode ser desfeita.</p>
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setConfirmAction(null)} disabled={isLoading}>
                  Voltar
                </Button>
                <Button onClick={() => handleAction('complete')} disabled={isLoading}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <CheckCircle2 size={16} className='me-1' />}
                  Confirmar Conclusão
                </Button>
              </DialogFooter>
            </>
          )}

          {confirmAction === 'cancel' && (
            <>
              <div className='rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm'>
                <p className='font-medium text-destructive'>Confirmar cancelamento da produção?</p>
                <p className='mt-1 text-muted-foreground'>Esta ação não pode ser desfeita.</p>
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setConfirmAction(null)} disabled={isLoading}>
                  Voltar
                </Button>
                <Button variant='destructive' onClick={() => handleAction('cancel')} disabled={isLoading}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <XCircle size={16} className='me-1' />}
                  Confirmar Cancelamento
                </Button>
              </DialogFooter>
            </>
          )}

          {confirmAction === 'reverse' && (
            <>
              <div className='rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm'>
                <p className='font-medium text-destructive'>Confirmar estorno da produção?</p>
                <p className='mt-1 text-muted-foreground'>O estoque do produto será revertido e os insumos serão devolvidos. A produção voltará para "Em Produção".</p>
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
                <Button variant='outline' onClick={() => { setConfirmAction(null); setReverseReason('') }} disabled={isLoading}>
                  Voltar
                </Button>
                <Button variant='destructive' onClick={handleReverse} disabled={isLoading || !reverseReason.trim()}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <RotateCcw size={16} className='me-1' />}
                  Confirmar Estorno
                </Button>
              </DialogFooter>
            </>
          )}

          {!confirmAction && (
            <>
              {productionItems.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>Produtos</h4>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productionItems.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className='font-medium'>
                              {item.product.name}
                            </TableCell>
                            <TableCell>
                              {item.quantity} {item.product.unit}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {compositionNeeded.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium'>Insumos Necessários</h4>
                  <div className='space-y-1'>
                    {compositionNeeded.map((item) => (
                      <div
                        key={item.supplyId}
                        className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                      >
                        <span>{item.supplyName}</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-muted-foreground'>
                            {item.needed} {item.unit}
                          </span>
                          <Badge variant={item.sufficient ? 'default' : 'destructive'}>
                            {item.available} disp.
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(production?.notes || currentRow?.notes) && (
                <div>
                  <h4 className='mb-1 text-sm font-medium'>Observação</h4>
                  <p className='text-sm text-muted-foreground'>
                    {production?.notes || currentRow?.notes}
                  </p>
                </div>
              )}

              {production?.completedAt && (
                <div>
                  <h4 className='mb-1 text-sm font-medium'>Concluída em</h4>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(production.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {(production?.reversedAt || currentRow?.reversedAt) && (
                <div className='rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2'>
                  <h4 className='mb-1 text-sm font-medium text-destructive'>Estorno</h4>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(production?.reversedAt || currentRow?.reversedAt || '').toLocaleString()}
                  </p>
                  {(production?.reversalReason || currentRow?.reversalReason) && (
                    <p className='mt-1 text-sm'>Motivo: {production?.reversalReason || currentRow?.reversalReason}</p>
                  )}
                </div>
              )}

              <DialogFooter className='gap-2'>
                {status === 'in_production' && (
                  <>
                    <Button onClick={() => setConfirmAction('complete')} disabled={isLoading}>
                      {isLoading ? <Loader2 className='animate-spin' /> : <CheckCircle2 size={16} className='me-1' />}
                      Concluir
                    </Button>
                    <Button variant='destructive' onClick={() => setConfirmAction('cancel')} disabled={isLoading}>
                      {isLoading ? <Loader2 className='animate-spin' /> : <XCircle size={16} className='me-1' />}
                      Cancelar
                    </Button>
                  </>
                )}
                {status === 'completed' && (
                  <>
                    <Button variant='destructive' onClick={() => setConfirmAction('reverse')}>
                      <RotateCcw size={16} className='me-1' />
                      Estornar
                    </Button>
                    <Button variant='outline' onClick={() => setOpen(null)}>
                      Fechar
                    </Button>
                  </>
                )}
                {status === 'cancelled' && (
                  <Button variant='outline' onClick={() => setOpen(null)}>
                    Fechar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
