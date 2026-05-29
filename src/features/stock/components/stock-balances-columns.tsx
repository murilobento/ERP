import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type StockBalance } from '../data/schema'

export const stockBalancesColumns: ColumnDef<StockBalance>[] = [
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tipo' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return (
        <Badge variant={type === 'product' ? 'default' : 'secondary'}>
          {type === 'product' ? 'Produto' : 'Insumo'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nome' />
    ),
    cell: ({ row }) => (
      <span className='ps-3 font-medium'>{row.getValue('name')}</span>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'packageUnit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Embalagem' />
    ),
    cell: ({ row }) => {
      const b = row.original
      if (b.type !== 'supply' || !b.packageUnit) {
        return <span className='ps-2 text-muted-foreground'>—</span>
      }
      return (
        <span className='ps-2'>
          {b.packageUnit} <span className='text-muted-foreground'>({b.packageQuantity} {b.unit})</span>
        </span>
      )
    },
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unidade base' />
    ),
    cell: ({ row }) => (
      <div className='ps-2 text-nowrap'>{row.getValue('unit')}</div>
    ),
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Saldo' />
    ),
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number
      return (
        <Badge variant={stock > 0 ? 'default' : stock < 0 ? 'destructive' : 'secondary'}>
          {stock}
        </Badge>
      )
    },
  },
]
