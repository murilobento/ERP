import { lazy, Suspense } from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

// eslint-disable-next-line react-refresh/only-export-components
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  }))
)
// eslint-disable-next-line react-refresh/only-export-components
const TanStackRouterDevtools = lazy(() =>
  import('@tanstack/react-router-devtools').then((module) => ({
    default: module.TanStackRouterDevtools,
  }))
)

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} position='top-center' />
        {import.meta.env.MODE === 'development' && (
          <Suspense fallback={null}>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </Suspense>
        )}
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
