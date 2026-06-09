import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { AuditLogs } from '@/features/audit-logs'

const auditLogsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/audit-logs/')({
  validateSearch: auditLogsSearchSchema,
  component: AuditLogs,
})
