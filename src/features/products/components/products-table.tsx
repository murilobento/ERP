import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableDeleteBulkActions } from '@/components/data-table'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Product } from '../data/schema'
import { productsColumns as columns } from './products-columns'
import { useProducts } from './products-provider'

type DataTableProps = {
  data: Product[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ProductsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useProducts()
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
        setOpen('view')
      }}
      labels={{
        name: 'Nome',
        categoryName: 'Categoria',
        unit: 'Unidade',
        stock: 'Estoque',
        compositionCount: 'Composição',
        status: 'Status',
      }}
      bulkActions={
        <DataTableDeleteBulkActions
          table={table}
          endpoint='/products'
          queryKey={['products']}
          entityName='produto'
          entityNamePlural='produtos'
        />
      }
    />
  )
}
