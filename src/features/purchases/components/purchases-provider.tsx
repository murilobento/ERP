import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Purchase } from '../data/schema'

type PurchasesDialogType = 'add' | 'view' | 'edit'

const { Provider: PurchasesProvider, useEntity: usePurchases } =
  createEntityProvider<Purchase, PurchasesDialogType>('Purchases')

// eslint-disable-next-line react-refresh/only-export-components
export { PurchasesProvider, usePurchases }
