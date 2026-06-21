import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type SupplyWithStock } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const suppliesColumns: ColumnDef<SupplyWithStock>[] = [
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
    accessorKey: 'packageUnit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Embalagem' />
    ),
    cell: ({ row }) => {
      const pkg = row.getValue('packageUnit') as string
      const qty = row.original.packageQuantity
      const unit = row.original.unit
      if (!pkg) return <span className='ps-2 text-muted-foreground'>—</span>
      return (
        <span className='ps-2'>
          {pkg} <span className='text-muted-foreground'>({qty} {unit})</span>
        </span>
      )
    },
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estoque' />
    ),
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number
      const unit = row.original.unit
      const pkgQty = row.original.packageQuantity
      const pkgUnit = row.original.packageUnit

      const fullPkgs = pkgUnit && pkgQty > 0 ? Math.floor(stock / pkgQty) : 0
      const remainder = pkgUnit && pkgQty > 0 ? stock % pkgQty : 0

      return (
        <div className='flex flex-col gap-0.5'>
          <Badge variant={stock > 0 ? 'default' : 'secondary'}>
            {stock} {unit}
          </Badge>
          {fullPkgs > 0 && (
            <span className='text-xs text-muted-foreground'>
              {fullPkgs} {fullPkgs === 1 ? pkgUnit : `${pkgUnit}s`}
              {remainder > 0 && ` + ${remainder} ${unit}`}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unidade' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('unit')}</div>
    ),
  },
  {
    accessorKey: 'costPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Preço de custo' />
    ),
    cell: ({ row }) => {
      const costPrice = row.getValue('costPrice') as number
      if (!costPrice) return <span className='text-muted-foreground'>—</span>
      const unit = row.original.unit
      return (
        <span>R$ {costPrice.toFixed(2)}/{unit}</span>
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
