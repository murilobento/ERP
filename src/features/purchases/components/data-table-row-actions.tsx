import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { CheckCircle2, Eye, Pen, RotateCcw, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Purchase } from '../data/schema'
import { usePurchases } from './purchases-provider'

type DataTableRowActionsProps = {
  row: Row<Purchase>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = usePurchases()
  const { auth } = useAuthStore()
  const purchase = row.original
  const canDelete =
    purchase.status === 'pending' &&
    (auth.user?.role === 'admin' || auth.user?.role === 'manager')

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
            setCurrentRow(purchase)
            setOpen('view')
          }}
        >
          Ver Detalhes
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {purchase.status === 'pending' && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(purchase)
                setOpen('edit')
              }}
            >
              Editar
              <DropdownMenuShortcut>
                <Pen size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(purchase)
                setOpen('complete')
              }}
            >
              Concluir
              <DropdownMenuShortcut>
                <CheckCircle2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
        {purchase.status === 'completed' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(purchase)
              setOpen('reverse')
            }}
            className='text-red-500!'
          >
            Estornar
            <DropdownMenuShortcut>
              <RotateCcw size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(purchase)
                setOpen('delete')
              }}
              className='text-red-500!'
            >
              Excluir
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
