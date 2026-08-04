import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type StockAdjustment } from '../data/schema'
import { adjustmentsColumns as columns } from './adjustments-columns'
import { useAdjustments } from './adjustments-provider'

type DataTableProps = {
  data: StockAdjustment[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function AdjustmentsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useAdjustments()
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
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('view')
      }}
      labels={{
        item: 'Item',
        itemType: 'Tipo',
        quantity: 'Quantidade',
        reason: 'Motivo',
        status: 'Status',
        author: 'Autor',
        completedAt: 'Concluído em',
      }}
    />
  )
}
