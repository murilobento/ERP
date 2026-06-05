import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Purchases } from '@/features/purchases'

const purchaseStatusSchema = z.enum(['pending', 'completed'])

const purchasesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  status: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(purchaseStatusSchema)
    )
    .optional()
    .catch([]),
  completedFrom: z.string().default(''),
  completedTo: z.string().default(''),
})

export const Route = createFileRoute('/_authenticated/purchases/')({
  validateSearch: purchasesSearchSchema,
  component: Purchases,
})
