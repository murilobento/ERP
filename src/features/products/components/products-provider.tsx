import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Product } from '../data/schema'

type ProductsDialogType = 'add' | 'edit' | 'delete' | 'composition' | 'view'

const { Provider: ProductsProvider, useEntity: useProducts } =
  createEntityProvider<Product, ProductsDialogType>('Products')

// eslint-disable-next-line react-refresh/only-export-components
export { ProductsProvider, useProducts }
