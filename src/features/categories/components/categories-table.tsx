import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableDeleteBulkActions } from '@/components/data-table'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Category } from '../data/schema'
import { categoriesColumns as columns } from './categories-columns'
import { useCategories } from './categories-provider'

type DataTableProps = {
  data: Category[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function CategoriesTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useCategories()
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
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('edit')
      }}
      labels={{
        name: 'Nome',
        productCount: 'Produtos',
        status: 'Status',
      }}
      bulkActions={
        <DataTableDeleteBulkActions
          table={table}
          endpoint='/categories'
          queryKey={['categories']}
          entityName='categoria'
          entityNamePlural='categorias'
        />
      }
    />
  )
}
