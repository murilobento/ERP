import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type StockMovement } from '../data/schema'
import { stockMovementsColumns as columns } from './stock-movements-columns'

type DataTableProps = {
  data: StockMovement[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function StockMovementsTable({ data, search, navigate }: DataTableProps) {
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const movement = row.original
      const name = movement.product?.name || movement.supply?.name || ''
      const notes = movement.notes || ''
      return (
        name.toLowerCase().includes(search) ||
        notes.toLowerCase().includes(search)
      )
    },
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      searchPlaceholder='Filtrar movimentações...'
      labels={{
        item: 'Item',
        itemType: 'Tipo',
        stockBefore: 'Estoque anterior',
        quantity: 'Movimentação',
        stockAfter: 'Atualizado',
        type: 'Movimento',
        author: 'Autor',
        createdAt: 'Data',
      }}
    />
  )
}
