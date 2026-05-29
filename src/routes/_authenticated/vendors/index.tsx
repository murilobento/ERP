import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Vendors } from '@/features/vendors'

const vendorsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/vendors/')({
  validateSearch: vendorsSearchSchema,
  component: Vendors,
})
