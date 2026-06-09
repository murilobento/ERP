import { type Table } from '@tanstack/react-table'
import { ContactBulkActions } from '@/features/shared/contact-bulk-actions'
import { type Client } from '../data/schema'

const clientConfig = {
  entityLabel: 'Cliente',
  entityLabelLower: 'cliente',
  endpoint: 'clients',
  queryKey: 'clients',
  formId: 'client-form',
  namePlaceholder: 'João Silva',
  entityPlural: 'clientes',
} as const

type DataTableBulkActionsProps = {
  table: Table<Client>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  return <ContactBulkActions table={table} config={clientConfig} />
}
