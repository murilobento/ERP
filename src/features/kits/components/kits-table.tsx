import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableDeleteBulkActions } from '@/components/data-table'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Kit } from '../data/schema'
import { kitsColumns as columns } from './kits-columns'
import { useKits } from './kits-provider'

type DataTableProps = {
  data: Kit[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function KitsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useKits()
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const { name } = row.original
      return name.toLowerCase().includes(search)
    },
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      searchPlaceholder='Filtrar por nome...'
      filters={[
        {
          columnId: 'status',
          title: 'Status',
          options: [
            { label: 'Ativo', value: 'active' },
            { label: 'Inativo', value: 'inactive' },
          ],
        },
      ]}
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('view')
      }}
      labels={{
        name: 'Nome',
        itemCount: 'Produtos',
        totalPrice: 'Preço total',
        discountValue: 'Desconto',
        finalPrice: 'Preço final',
        status: 'Status',
      }}
      bulkActions={
        <DataTableDeleteBulkActions
          table={table}
          endpoint='/kits'
          queryKey={['kits']}
          entityName='kit'
          entityNamePlural='kits'
        />
      }
    />
  )
}
