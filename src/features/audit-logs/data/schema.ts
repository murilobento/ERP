export type AuditLog = {
  id: string
  action: string
  actionLabel: string
  authorId: string
  targetUserId: string
  changes: Record<string, { old: unknown; new: unknown }>
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  targetUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}
