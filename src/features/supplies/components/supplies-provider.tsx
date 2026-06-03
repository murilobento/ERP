import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Supply } from '../data/schema'

type SuppliesDialogType = 'add' | 'edit' | 'delete'

const { Provider: SuppliesProvider, useEntity: useSupplies } =
  createEntityProvider<Supply, SuppliesDialogType>('Supplies')

// eslint-disable-next-line react-refresh/only-export-components
export { SuppliesProvider, useSupplies }
