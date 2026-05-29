import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { StockMovements } from '@/features/stock/movements'

const stockMovementsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/stock/movements')({
  validateSearch: stockMovementsSearchSchema,
  component: StockMovements,
})
