import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type User } from '../data/schema'

type DataTableBulkActionsProps = {
  table: Table<User>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()

  const handleBulkDelete = async () => {
    const ids = selectedRows.map((row) => row.original.id)
    try {
      await Promise.all(ids.map((id) => api.delete(`/users/${id}`)))
      toast.success(`${ids.length} usuário${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''}.`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch {
      toast.error('Falha ao excluir alguns usuários.')
    }
    setShowDeleteConfirm(false)
  }

  if (selectedRows.length === 0) return null

  return (
    <>
      <BulkActionsToolbar table={table} entityName='usuário'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Excluir usuários selecionados'
              title='Excluir usuários selecionados'
            >
              <Trash2 />
              <span className='sr-only'>Excluir usuários selecionados</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Excluir usuários selecionados</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='rounded-lg border bg-background p-6 shadow-lg'>
            <h3 className='text-lg font-semibold'>Excluir {selectedRows.length} usuário{selectedRows.length > 1 ? 's' : ''}?</h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Esta ação não pode ser desfeita.
            </p>
            <div className='mt-4 flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button variant='destructive' onClick={handleBulkDelete}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
