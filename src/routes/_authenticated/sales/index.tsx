import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Sales } from '@/features/sales'

const saleStatusSchema = z.enum([
  'in_preparation',
  'ready_for_delivery',
  'delivered',
  'completed',
])

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const salesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  status: z
    .preprocess((value) => (typeof value === 'string' ? [value] : value), z.array(saleStatusSchema))
    .optional()
    .catch([]),
  payment: z.enum(['confirmed', 'pending']).optional().catch(undefined),
  paidFrom: z.string().optional().catch(''),
  paidTo: z.string().optional().catch(''),
  deliveryFrom: z.string().default(todayStr()),
  deliveryTo: z.string().default(todayStr()),
})

export const Route = createFileRoute('/_authenticated/sales/')({
  validateSearch: salesSearchSchema,
  component: Sales,
})
