import { createFileRoute } from '@tanstack/react-router'
import { Company } from '@/features/company'

export const Route = createFileRoute('/_authenticated/company/')({
  component: Company,
})
