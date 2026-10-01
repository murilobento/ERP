import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateInAppTimeZone } from '@/features/shared/filter-date-utils'
import {
  formatCurrency,
  supplyPurchaseStatusMap,
  type SupplyPurchaseHistory,
} from '../data/schema'
import { useSupplies } from './supplies-provider'

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border px-3 py-2'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-0.5 text-sm font-semibold'>{value}</p>
    </div>
  )
}

export function SuppliesHistoryDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useSupplies()
  const supplyId = currentRow?.id

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.supplyPurchases(supplyId!),
    queryFn: async () => {
      const res = await api.get<SupplyPurchaseHistory>(
        `/supplies/${supplyId}/purchases`
      )
      return res.data
    },
    enabled: open === 'history' && !!currentRow,
    staleTime: 0,
  })

  if (!currentRow) return null

  function handleClose(state: boolean) {
    if (!state) {
      setOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
    }
  }

  const supply = data?.supply ?? currentRow
  const purchases = data?.purchases ?? []
  const summary = data?.summary
  const packageUnit = supply.packageUnit || 'emb.'

  return (
    <Dialog open={open === 'history'} onOpenChange={handleClose}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>Histórico de compras</DialogTitle>
          <DialogDescription>
            Insumo: <strong>{supply.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='animate-spin' />
          </div>
        )}

        {!isLoading && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                <SummaryCard
                  label='Total gasto'
                  value={formatCurrency(summary?.totalSpent ?? 0)}
                />
                <SummaryCard
                  label='Compras concluídas'
                  value={String(summary?.count ?? 0)}
                />
                <SummaryCard
                  label='Preço médio'
                  value={`${formatCurrency(summary?.avgUnitPrice ?? 0)}/${supply.unit}`}
                />
                <SummaryCard
                  label='Custo atual'
                  value={`${formatCurrency(supply.costPrice)}/${supply.unit}`}
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                Resumo considera apenas compras concluídas.
              </p>
            </div>

            <div>
              <h4 className='mb-2 text-sm font-medium'>Compras</h4>
              {purchases.length === 0 ? (
                <div className='rounded-md border px-3 py-8 text-center text-sm text-muted-foreground'>
                  Nenhuma compra registrada para este insumo.
                </div>
              ) : (
                <div className='max-h-[320px] space-y-1 overflow-y-auto'>
                  {purchases.map((purchase) => {
                    const statusConfig = supplyPurchaseStatusMap[
                      purchase.status
                    ] || {
                      label: purchase.status,
                      variant: 'secondary' as const,
                    }
                    return (
                      <div
                        key={`${purchase.id}-${purchase.createdAt}`}
                        className='rounded-md border px-3 py-2 text-sm'
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <span className='font-medium'>
                            {purchase.supplier}
                          </span>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className='mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground'>
                          <span>
                            {formatDateInAppTimeZone(purchase.createdAt)}
                          </span>
                          <span>·</span>
                          <span>
                            {purchase.packages} {packageUnit}(s) ={' '}
                            {purchase.quantity} {supply.unit}
                          </span>
                          <span>·</span>
                          <span>
                            {formatCurrency(purchase.packageCost)}/{packageUnit}
                          </span>
                        </div>
                        <div className='mt-1 flex flex-wrap items-center justify-between gap-x-2 text-xs'>
                          <span className='text-muted-foreground'>
                            Unit. {formatCurrency(purchase.unitPrice)}/
                            {supply.unit}
                          </span>
                          <span className='text-sm font-semibold'>
                            {formatCurrency(purchase.total)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => handleClose(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
