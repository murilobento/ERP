import { type Table } from '@tanstack/react-table'
import { ContactBulkActions } from '@/features/shared/contact-bulk-actions'
import { clientConfig } from '@/features/shared/contact-configs'
import { type Client } from '../data/schema'

type DataTableBulkActionsProps = {
  table: Table<Client>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  return <ContactBulkActions table={table} config={clientConfig} />
}
