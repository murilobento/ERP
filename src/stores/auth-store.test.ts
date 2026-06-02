import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore, type AuthUser } from './auth-store'

const user: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'Sistema',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().auth.reset()
  })

  it('starts without an authenticated user', () => {
    expect(useAuthStore.getState().auth.user).toBeNull()
  })

  it('stores and clears the authenticated user', () => {
    useAuthStore.getState().auth.setUser(user)

    expect(useAuthStore.getState().auth.user).toEqual(user)

    useAuthStore.getState().auth.reset()

    expect(useAuthStore.getState().auth.user).toBeNull()
  })
})
