import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Clients } from '@/features/clients'

const clientsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/clients/')({
  validateSearch: clientsSearchSchema,
  component: Clients,
})
