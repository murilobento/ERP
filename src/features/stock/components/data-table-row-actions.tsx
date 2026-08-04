import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Eye, Pen, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type StockAdjustment } from '../data/schema'
import { useAdjustments } from './adjustments-provider'

type DataTableRowActionsProps = {
  row: Row<StockAdjustment>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useAdjustments()
  const { run } = useEntityMutation()
  const adjustment = row.original

  async function handleDelete() {
    await run({
      mutation: () => api.delete(`/stock/adjustments/${adjustment.id}`),
      invalidate: [queryKeys.stock.adjustments],
      successMessage: 'Acerto removido.',
    })
  }

  return (
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
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(adjustment)
            setOpen('view')
          }}
        >
          Ver Detalhes
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {adjustment.status === 'pending' && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(adjustment)
                setOpen('edit')
              }}
            >
              Editar
              <DropdownMenuShortcut>
                <Pen size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className='text-destructive focus:text-destructive'
            >
              Remover
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
