import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Kit } from '../data/schema'

type KitsDialogType = 'add' | 'edit' | 'delete' | 'view'

const { Provider: KitsProvider, useEntity: useKits } = createEntityProvider<
  Kit,
  KitsDialogType
>('Kits')

// eslint-disable-next-line react-refresh/only-export-components
export { KitsProvider, useKits }
