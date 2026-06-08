import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Stock } from '@/features/stock'

const stockAdjustmentStatusSchema = z.enum(['pending', 'completed', 'reversed'])

const stockSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  status: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(stockAdjustmentStatusSchema)
    )
    .optional()
    .catch([]),
  itemType: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(z.enum(['product', 'supply']))
    )
    .optional()
    .catch([]),
  dateFrom: z.string().optional().catch(''),
  dateTo: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/stock/')({
  validateSearch: stockSearchSchema,
  component: Stock,
})
