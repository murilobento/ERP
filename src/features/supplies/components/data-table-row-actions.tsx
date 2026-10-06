import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { History, Trash2, Pen, Power } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStatusToggleAction } from '@/features/shared/use-status-toggle-action'
import { type Supply } from '../data/schema'
import { useSupplies } from './supplies-provider'

type DataTableRowActionsProps = {
  row: Row<Supply>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useSupplies()
  const statusAction = useStatusToggleAction({
    entityLabel: 'Insumo',
    status: row.original.status,
    invalidate: [queryKeys.supplies],
    onToggle: (status) => api.patch(`/supplies/${row.original.id}`, { status }),
  })

  function openHistory() {
    setCurrentRow(row.original)
    setOpen('history')
  }

  return (
    <div className='flex items-center justify-end gap-1'>
      <Button
        variant='ghost'
        className='flex h-8 w-8 p-0 hover:text-primary'
        aria-label='Histórico de compras'
        title='Histórico de compras'
        onClick={openHistory}
      >
        <History size={16} />
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem onClick={openHistory}>
            Histórico de compras
            <DropdownMenuShortcut>
              <History size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={statusAction.openConfirmation}
            className={
              statusAction.isActive ? 'text-red-500!' : 'text-green-600!'
            }
          >
            {statusAction.actionLabel}
            <DropdownMenuShortcut>
              <Power size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Editar
            <DropdownMenuShortcut>
              <Pen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            Excluir
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {statusAction.confirmationDialog}
    </div>
  )
}
