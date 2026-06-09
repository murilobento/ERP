import { createFileRoute } from '@tanstack/react-router'
import { ErrorPageRouter } from '@/features/errors/error-page-router'

export const Route = createFileRoute('/_authenticated/errors/$error')({
  component: function ErrorRoute() {
    const { error } = Route.useParams()
    return <ErrorPageRouter error={error} />
  },
})
