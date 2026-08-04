import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { CheckCircle2, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Production } from '../data/schema'

type ProductionBulkAction = 'complete' | 'cancel'

type DataTableBulkActionsProps = {
  table: Table<Production>
}

const actionConfig = {
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
  const { run } = useEntityMutation()

  const eligibleRows = {
    complete: selectedRows.filter(
      (row) => row.original.status === 'in_production'
    ),
    cancel: selectedRows.filter(
      (row) => row.original.status === 'in_production'
    ),
  }

  const handleBulkAction = async (action: ProductionBulkAction) => {
    const rows = eligibleRows[action]

    await run({
      mutation: () =>
        Promise.all(
          rows.map((row) =>
            api.post(`/productions/${row.original.id}/${action}`)
          )
        ),
      invalidate: [
        queryKeys.productions,
        ...(action === 'complete'
          ? [
              queryKeys.products,
              queryKeys.supplies,
              queryKeys.stock.balances,
              queryKeys.stock.movements,
            ]
          : []),
      ],
      successMessage: actionConfig[action].success,
      onSuccess: () => table.resetRowSelection(),
    })

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
