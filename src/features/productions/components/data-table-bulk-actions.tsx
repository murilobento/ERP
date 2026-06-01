import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Production } from '../data/schema'

type ProductionBulkAction = 'start' | 'complete' | 'cancel'

type DataTableBulkActionsProps = {
  table: Table<Production>
}

const actionConfig = {
  start: {
    label: 'Iniciar',
    title: 'Iniciar produções em rascunho selecionadas',
    success: 'Produções iniciadas.',
  },
  complete: {
    label: 'Concluir',
    title: 'Concluir produções em andamento selecionadas',
    success: 'Produções concluídas. Estoque atualizado.',
  },
  cancel: {
    label: 'Cancelar',
    title: 'Cancelar produções selecionadas',
    success: 'Produções canceladas.',
  },
} satisfies Record<
  ProductionBulkAction,
  { label: string; title: string; success: string }
>

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  const [confirmAction, setConfirmAction] =
    useState<ProductionBulkAction | null>(null)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()

  const eligibleRows = {
    start: selectedRows.filter((row) => row.original.status === 'draft'),
    complete: selectedRows.filter(
      (row) => row.original.status === 'in_production'
    ),
    cancel: selectedRows.filter((row) =>
      ['draft', 'in_production'].includes(row.original.status)
    ),
  }

  const handleBulkAction = async (action: ProductionBulkAction) => {
    const rows = eligibleRows[action]

    try {
      await Promise.all(
        rows.map((row) => api.post(`/productions/${row.original.id}/${action}`))
      )
      toast.success(actionConfig[action].success)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['productions'] })
      if (action === 'complete') {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['supplies'] })
        queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Falha ao atualizar produções selecionadas.'
      toast.error(message)
    }

    setConfirmAction(null)
  }

  if (selectedRows.length === 0) return null

  return (
    <>
      <BulkActionsToolbar
        table={table}
        entityName='produção'
        entityNamePlural='produções'
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='outline'
              onClick={() => setConfirmAction('start')}
              disabled={eligibleRows.start.length === 0}
              className='size-8'
              aria-label={actionConfig.start.title}
              title={actionConfig.start.title}
            >
              <Clock />
              <span className='sr-only'>{actionConfig.start.title}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{actionConfig.start.title}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              onClick={() => setConfirmAction('complete')}
              disabled={eligibleRows.complete.length === 0}
              className='size-8'
              aria-label={actionConfig.complete.title}
              title={actionConfig.complete.title}
            >
              <CheckCircle2 />
              <span className='sr-only'>{actionConfig.complete.title}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{actionConfig.complete.title}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='destructive'
              onClick={() => setConfirmAction('cancel')}
              disabled={eligibleRows.cancel.length === 0}
              className='size-8'
              aria-label={actionConfig.cancel.title}
              title={actionConfig.cancel.title}
            >
              <XCircle />
              <span className='sr-only'>{actionConfig.cancel.title}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{actionConfig.cancel.title}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      {confirmAction && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='rounded-lg border bg-background p-6 shadow-lg'>
            <h3 className='text-lg font-semibold'>
              {actionConfig[confirmAction].label}{' '}
              {eligibleRows[confirmAction].length}{' '}
              {eligibleRows[confirmAction].length > 1
                ? 'produções'
                : 'produção'}
              ?
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Somente produções selecionadas com status compatível serão
              alteradas.
            </p>
            <div className='mt-4 flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setConfirmAction(null)}>
                Voltar
              </Button>
              <Button
                variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
                onClick={() => handleBulkAction(confirmAction)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
