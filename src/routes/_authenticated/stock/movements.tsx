import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { StockMovements } from '@/features/stock/movements'

const movementTypeSchema = z.enum([
  'production_output',
  'production_consumption',
  'production_reversal',
  'purchase',
  'purchase_reversal',
  'sale_delivery',
  'sale_reversal',
  'adjustment',
  'adjustment_reversal',
])

const stockMovementsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  itemType: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(z.enum(['product', 'supply']))
    )
    .optional()
    .catch([]),
  movementTypes: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(movementTypeSchema)
    )
    .optional()
    .catch([]),
  dateFrom: z.string().optional().catch(''),
  dateTo: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/stock/movements')({
  validateSearch: stockMovementsSearchSchema,
  component: StockMovements,
})
