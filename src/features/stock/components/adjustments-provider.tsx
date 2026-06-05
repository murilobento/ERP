import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type StockAdjustment } from '../data/schema'

type AdjustmentsDialogType = 'add' | 'view' | 'edit'

const { Provider: AdjustmentsProvider, useEntity: useAdjustments } =
  createEntityProvider<StockAdjustment, AdjustmentsDialogType>('Adjustments')

// eslint-disable-next-line react-refresh/only-export-components
export { AdjustmentsProvider, useAdjustments }
