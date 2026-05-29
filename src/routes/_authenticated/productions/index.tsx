import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Productions } from '@/features/productions'

const productionsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/productions/')({
  validateSearch: productionsSearchSchema,
  component: Productions,
})
