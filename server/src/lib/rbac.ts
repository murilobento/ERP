import type { Context, Next } from 'hono'

export const ROLES = ['admin', 'manager', 'operator', 'viewer'] as const
export type Role = (typeof ROLES)[number]

function isRole(value: string): value is Role {
  return ROLES.some((role) => role === value)
}

export function requireRole(...allowed: Role[]) {
  return async (c: Context, next: Next) => {
    const role = c.get('userRole')

    if (!isRole(role) || !allowed.includes(role)) {
      return c.json({ error: 'Acesso negado.' }, 403)
    }

    await next()
  }
}
