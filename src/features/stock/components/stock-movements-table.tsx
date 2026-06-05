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
    globalFilterEnabled: false,
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      showSearch={false}
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
