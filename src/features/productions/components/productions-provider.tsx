import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Production } from '../data/schema'

type ProductionsDialogType = 'add' | 'view' | 'delete'

const { Provider: ProductionsProvider, useEntity: useProductions } =
  createEntityProvider<Production, ProductionsDialogType>('Productions')

// eslint-disable-next-line react-refresh/only-export-components
export { ProductionsProvider, useProductions }
