import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Kit, formatCurrency } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const kitsColumns: ColumnDef<Kit>[] = [
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
    id: 'itemCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Produtos' />
    ),
    accessorFn: (row) => row.items.length,
    cell: ({ row }) => {
      const count = row.original.items.length
      return (
        <Badge variant='secondary'>
          {count} {count === 1 ? 'produto' : 'produtos'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'totalPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Preço total' />
    ),
    cell: ({ row }) => {
      const totalPrice = row.getValue('totalPrice') as number
      return (
        <span>{totalPrice > 0 ? formatCurrency(totalPrice) : '—'}</span>
      )
    },
  },
  {
    accessorKey: 'discountValue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Desconto' />
    ),
    cell: ({ row }) => {
      const kit = row.original
      if (kit.discountValue <= 0) {
        return <span className='text-muted-foreground'>—</span>
      }
      if (kit.discountType === 'percentage') {
        return <span className='text-red-500'>-{kit.discountValue}%</span>
      }
      return <span className='text-red-500'>-{formatCurrency(kit.discountValue)}</span>
    },
  },
  {
    accessorKey: 'finalPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Preço final' />
    ),
    cell: ({ row }) => {
      const finalPrice = row.getValue('finalPrice') as number
      return (
        <span className='font-semibold text-green-600'>
          {finalPrice > 0 ? formatCurrency(finalPrice) : '—'}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    filterFn: (row, columnId, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.getValue(columnId))
      }
      return row.getValue(columnId) === filterValue
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
