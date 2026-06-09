import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Vendor } from '../data/schema'

type VendorsDialogType = 'add' | 'edit'

const { Provider: VendorsProvider, useEntity: useVendors } =
  createEntityProvider<Vendor, VendorsDialogType>('Vendors')

// eslint-disable-next-line react-refresh/only-export-components
export { VendorsProvider, useVendors }
