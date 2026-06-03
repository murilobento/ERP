import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Category } from '../data/schema'

type CategoriesDialogType = 'add' | 'edit' | 'delete'

const { Provider: CategoriesProvider, useEntity: useCategories } =
  createEntityProvider<Category, CategoriesDialogType>('Categories')

// eslint-disable-next-line react-refresh/only-export-components
export { CategoriesProvider, useCategories }
