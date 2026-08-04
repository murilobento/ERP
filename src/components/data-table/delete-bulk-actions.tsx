import { useState } from 'react'
import { type QueryKey } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from './bulk-actions'

type DataTableDeleteBulkActionsProps<TData extends { id: string }> = {
  table: Table<TData>
  endpoint: string
  queryKey: QueryKey
  entityName: string
  entityNamePlural: string
}

export function DataTableDeleteBulkActions<TData extends { id: string }>({
  table,
  endpoint,
  queryKey,
  entityName,
  entityNamePlural,
}: DataTableDeleteBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const { run } = useEntityMutation()

  const handleBulkDelete = async () => {
    const ids = selectedRows.map((row) => row.original.id)

    await run({
      mutation: () =>
        Promise.all(ids.map((id) => api.delete(`${endpoint}/${id}`))),
      invalidate: [queryKey],
      successMessage: `${ids.length} ${ids.length > 1 ? entityNamePlural : entityName} excluído${ids.length > 1 ? 's' : ''}.`,
      onSuccess: () => table.resetRowSelection(),
    })

    setShowDeleteConfirm(false)
  }

  if (selectedRows.length === 0) return null

  return (
    <>
      <BulkActionsToolbar
        table={table}
        entityName={entityName}
        entityNamePlural={entityNamePlural}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label={`Excluir ${entityNamePlural} selecionados`}
              title={`Excluir ${entityNamePlural} selecionados`}
            >
              <Trash2 />
              <span className='sr-only'>
                Excluir {entityNamePlural} selecionados
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Excluir {entityNamePlural} selecionados</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {selectedRows.length}{' '}
              {selectedRows.length > 1 ? entityNamePlural : entityName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={handleBulkDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
