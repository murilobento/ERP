import { useEffect, useState } from 'react'
import {
  type ColumnDef,
  type FilterFn,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  type NavigateFn,
  useTableUrlState,
} from '@/hooks/use-table-url-state'

type UseDataTableOptions<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  search: Record<string, unknown>
  navigate: NavigateFn
  globalFilterFn?: FilterFn<TData>
  globalFilterEnabled?: boolean
  defaultColumnVisibility?: VisibilityState
}

export function useDataTable<TData>({
  data,
  columns,
  search,
  navigate,
  globalFilterFn,
  globalFilterEnabled = true,
  defaultColumnVisibility,
}: UseDataTableOptions<TData>) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    defaultColumnVisibility ?? {}
  )
  const [sorting, setSorting] = useState<SortingState>([])

  const {
    pagination,
    onPaginationChange,
    ensurePageInRange,
    globalFilter,
    onGlobalFilterChange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: globalFilterEnabled },
    columnFilters: [],
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
      globalFilter,
    },
    enableRowSelection: true,
    onPaginationChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange,
    globalFilterFn,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return { table }
}
