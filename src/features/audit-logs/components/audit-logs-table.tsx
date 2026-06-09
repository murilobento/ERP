import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type AuditLog } from '../data/schema'
import { auditLogsColumns as columns } from './audit-logs-columns'

type DataTableProps = {
  data: AuditLog[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function AuditLogsTable({ data, search, navigate }: DataTableProps) {
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
      searchPlaceholder='Filtrar logs...'
      searchKey='actionLabel'
      filters={[]}
    />
  )
}
