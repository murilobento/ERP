import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Purchase } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const statusMap: Record<
  string,
  { label: string; variant: 'warning' | 'success' }
> = {
  pending: { label: 'Pendente', variant: 'warning' },
  completed: { label: 'Concluída', variant: 'success' },
}

export const purchasesColumns: ColumnDef<Purchase>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Selecionar todos'
        className='translate-y-0.5'
      />
    ),
    meta: {
      className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Selecionar linha'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'supplier',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fornecedor' />
    ),
    cell: ({ row }) => (
      <span className='ps-3 font-medium'>{row.getValue('supplier')}</span>
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
    id: 'itemCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Itens' />
    ),
    accessorFn: (row) => row.items?.length || 0,
    cell: ({ row }) => {
      const count = row.original.items?.length || 0
      return (
        <span className='ps-2 text-muted-foreground'>
          {count} {count === 1 ? 'item' : 'itens'}
        </span>
      )
    },
  },
  {
    id: 'totalPackages',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Embalagens' />
    ),
    accessorFn: (row) =>
      row.items?.reduce((sum, i) => sum + i.packages, 0) || 0,
    cell: ({ row }) => {
      const total =
        row.original.items?.reduce((sum, i) => sum + i.packages, 0) || 0
      return <span className='ps-2'>{total}</span>
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const config = statusMap[status] || {
        label: status,
        variant: 'secondary' as const,
      }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Criado em' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div className='text-nowrap'>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
