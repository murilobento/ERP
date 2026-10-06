import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { CheckCircle2, Eye, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Production } from '../data/schema'
import { useProductions } from './productions-provider'

type DataTableRowActionsProps = {
  row: Row<Production>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useProductions()
  const production = row.original
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
            setCurrentRow(production)
            setOpen('view')
          }}
        >
          Ver Detalhes
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {production.status === 'in_production' && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(production)
                setOpen('complete')
              }}
            >
              Concluir
              <DropdownMenuShortcut>
                <CheckCircle2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(production)
                setOpen('cancel')
              }}
              className='text-red-500!'
            >
              Cancelar
              <DropdownMenuShortcut>
                <XCircle size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
        {production.status === 'completed' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(production)
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
