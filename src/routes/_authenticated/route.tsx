import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { auth } = useAuthStore.getState()
    if (auth.user) return

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      auth.setUser(data.user)
    } catch {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: AuthenticatedLayout,
})
