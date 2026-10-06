import { vendorConfig } from '@/features/shared/contact-configs'
import { ContactPrimaryButtons } from '@/features/shared/contact-primary-buttons'
import { useVendors } from './vendors-provider'

export function VendorsPrimaryButtons() {
  const { setOpen } = useVendors()
  return (
    <ContactPrimaryButtons config={vendorConfig} onAdd={() => setOpen('add')} />
  )
}
