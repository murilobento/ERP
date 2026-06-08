import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { DataTableColumnHeader } from '@/components/data-table'
import { type StockMovement } from '../data/schema'
import { ReferenceHoverContent } from './stock-movements-reference-hover'

const typeMap: Record<string, string> = {
  production_output: 'Produção de Produto',
  production_consumption: 'Consumo na Produção',
  purchase: 'Compra',
  purchase_reversal: 'Estorno de Compra',
  sale_delivery: 'Entrega de Venda',
  sale_reversal: 'Estorno de Venda',
  adjustment: 'Ajuste Manual',
  adjustment_reversal: 'Estorno de Ajuste',
}

function formatStock(value: number | null, unit?: string) {
  if (value === null) return '—'
  return `${value} ${unit || ''}`.trim()
}

function getMovementLabel(movement: StockMovement) {
  if (movement.type === 'production_reversal') {
    return movement.product
      ? 'Estorno de Produto Produzido'
      : 'Devolução de Insumo da Produção'
  }

  return typeMap[movement.type] || movement.type
}

export const stockMovementsColumns: ColumnDef<StockMovement>[] = [
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
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Movimento' />
    ),
    cell: ({ row }) => {
      const m = row.original
      const label = getMovementLabel(m)

      if (!m.reference) {
        return <span className='ps-2'>{label}</span>
      }

      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className='cursor-default ps-2 underline decoration-dashed underline-offset-4 text-primary'>
              {label}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className='w-auto min-w-72 p-3'>
            <ReferenceHoverContent reference={m.reference} />
          </HoverCardContent>
        </HoverCard>
      )
    },
  },
  {
    accessorKey: 'stockBefore',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Anterior' />
    ),
    cell: ({ row }) => {
      const m = row.original
      return (
        <span className='ps-2 text-muted-foreground'>
          {formatStock(m.stockBefore, m.product?.unit || m.supply?.unit)}
        </span>
      )
    },
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Movimentação' />
    ),
    cell: ({ row }) => {
      const m = row.original
      const q = row.getValue('quantity') as number
      return (
        <span className={q >= 0 ? 'text-green-600' : 'text-red-600'}>
          {q > 0 ? '+' : ''}{formatStock(q, m.product?.unit || m.supply?.unit)}
        </span>
      )
    },
  },
  {
    accessorKey: 'stockAfter',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Atualizado' />
    ),
    cell: ({ row }) => {
      const m = row.original
      return (
        <span className='ps-2 font-medium'>
          {formatStock(m.stockAfter, m.product?.unit || m.supply?.unit)}
        </span>
      )
    },
  },
  {
    id: 'author',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Autor' />
    ),
    accessorFn: (row) =>
      row.author ? `${row.author.firstName} ${row.author.lastName}` : '',
    cell: ({ row }) => {
      const author = row.original.author
      return (
        <span className='ps-2 text-muted-foreground'>
          {author ? `${author.firstName} ${author.lastName}` : '—'}
        </span>
      )
    },
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
