import { ContactPrimaryButtons } from '@/features/shared/contact-primary-buttons'
import { useClients } from './clients-provider'

const clientConfig = {
  entityLabel: 'Cliente',
  entityLabelLower: 'cliente',
  endpoint: 'clients',
  queryKey: 'clients',
  formId: 'client-form',
  namePlaceholder: 'João Silva',
  entityPlural: 'clientes',
} as const

export function ClientsPrimaryButtons() {
  const { setOpen } = useClients()
  return <ContactPrimaryButtons config={clientConfig} onAdd={() => setOpen('add')} />
}
