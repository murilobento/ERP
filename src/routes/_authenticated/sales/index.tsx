import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Sales } from '@/features/sales'

const saleStatusSchema = z.enum([
  'in_preparation',
  'ready_for_delivery',
  'delivered',
  'completed',
])

const salesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  status: z
    .preprocess((value) => (typeof value === 'string' ? [value] : value), z.array(saleStatusSchema))
    .optional()
    .catch([]),
  payment: z.enum(['confirmed', 'pending']).optional().catch(undefined),
  createdFrom: z.string().optional().catch(''),
  createdTo: z.string().optional().catch(''),
  paidFrom: z.string().optional().catch(''),
  paidTo: z.string().optional().catch(''),
  deliveryFrom: z.string().optional().catch(''),
  deliveryTo: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/sales/')({
  validateSearch: salesSearchSchema,
  component: Sales,
})
