import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Stock } from '@/features/stock'

const stockSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/stock/')({
  validateSearch: stockSearchSchema,
  component: Stock,
})
