import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState()
    if (auth.user) return

    const redirectToSignIn = () =>
      redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) throw redirectToSignIn()
      const data = await res.json()
      auth.setUser(data.user)
    } catch (error) {
      auth.reset()
      if (isRedirect(error)) throw error
      throw redirectToSignIn()
    }
  },
  component: AuthenticatedLayout,
})
