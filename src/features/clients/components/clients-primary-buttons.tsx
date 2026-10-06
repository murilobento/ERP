import { clientConfig } from '@/features/shared/contact-configs'
import { ContactPrimaryButtons } from '@/features/shared/contact-primary-buttons'
import { useClients } from './clients-provider'

export function ClientsPrimaryButtons() {
  const { setOpen } = useClients()
  return (
    <ContactPrimaryButtons config={clientConfig} onAdd={() => setOpen('add')} />
  )
}
