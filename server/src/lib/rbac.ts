import type { Context, Next } from 'hono'

export const ROLES = ['admin', 'manager', 'operator', 'viewer'] as const
export type Role = (typeof ROLES)[number]

export function requireRole(...allowed: Role[]) {
  return async (c: Context, next: Next) => {
    const role = c.get('userRole') as Role | undefined

    if (!role || !allowed.includes(role)) {
      return c.json({ error: 'Acesso negado.' }, 403)
    }

    await next()
  }
}
