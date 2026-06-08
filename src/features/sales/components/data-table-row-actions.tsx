import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Eye, FileText, Pen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Sale } from '../data/schema'
import { downloadInvoice } from '../lib/download-invoice'
import { useSales } from './sales-provider'

type DataTableRowActionsProps = {
  row: Row<Sale>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useSales()
  const sale = row.original

  async function handleInvoice() {
    try {
      await downloadInvoice(sale.id, sale.customer)
    } catch {
      // silencioso — erro já tratado pela rede
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(sale)
            setOpen('view')
          }}
        >
          Ver Detalhes
          <DropdownMenuShortcut><Eye size={16} /></DropdownMenuShortcut>
        </DropdownMenuItem>
        {sale.status !== 'completed' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(sale)
              setOpen('edit')
            }}
          >
            Editar
            <DropdownMenuShortcut><Pen size={16} /></DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleInvoice}>
          Gerar Fatura
          <DropdownMenuShortcut><FileText size={16} /></DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
