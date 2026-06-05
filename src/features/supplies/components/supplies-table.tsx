import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableDeleteBulkActions } from '@/components/data-table'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type SupplyWithStock } from '../data/schema'
import { suppliesColumns as columns } from './supplies-columns'
import { useSupplies } from './supplies-provider'

type DataTableProps = {
  data: SupplyWithStock[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function SuppliesTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useSupplies()
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
        setOpen('edit')
      }}
      labels={{
        name: 'Nome',
        unit: 'Unidade',
        stock: 'Estoque',
        status: 'Status',
        createdAt: 'Criado em',
      }}
      bulkActions={
        <DataTableDeleteBulkActions
          table={table}
          endpoint='/supplies'
          queryKey={['supplies']}
          entityName='insumo'
          entityNamePlural='insumos'
        />
      }
    />
  )
}
