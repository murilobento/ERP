import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type StockMovement } from '../data/schema'

const typeMap: Record<string, string> = {
  production_output: 'Produção (saída)',
  production_consumption: 'Produção (consumo)',
  purchase: 'Compra',
  purchase_reversal: 'Estorno de Compra',
  adjustment: 'Ajuste',
}

export const stockMovementsColumns: ColumnDef<StockMovement>[] = [
  {
    id: 'item',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Item' />
    ),
    cell: ({ row }) => {
      const m = row.original
      const name = m.product?.name || m.supply?.name || '—'
      return <span className='ps-3 font-medium'>{name}</span>
    },
    accessorFn: (row) => row.product?.name || row.supply?.name || '',
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    id: 'itemType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tipo Item' />
    ),
    cell: ({ row }) => {
      const m = row.original
      return (
        <Badge variant={m.product ? 'default' : 'secondary'}>
          {m.product ? 'Produto' : 'Insumo'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Quantidade' />
    ),
    cell: ({ row }) => {
      const q = row.getValue('quantity') as number
      return (
        <span className={q >= 0 ? 'text-green-600' : 'text-red-600'}>
          {q > 0 ? '+' : ''}{q}
        </span>
      )
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Movimento' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return <span className='ps-2'>{typeMap[type] || type}</span>
    },
  },
  {
    accessorKey: 'notes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Observação' />
    ),
    cell: ({ row }) => (
      <span className='ps-2 text-muted-foreground'>{row.getValue('notes') || '—'}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div className='text-nowrap'>{date.toLocaleString()}</div>
    },
  },
]
