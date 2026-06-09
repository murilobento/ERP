import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'

type AuditLog = {
  id: string
  action: string
  actionLabel: string
  authorId: string
  targetUserId: string
  changes: Record<string, { old: unknown; new: unknown }>
  createdAt: string
  author: { firstName: string; lastName: string; email: string }
  targetUser: { firstName: string; lastName: string; email: string }
}

const actionBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  user_created: 'default',
  user_updated: 'secondary',
}

const fieldLabels: Record<string, string> = {
  email: 'Email',
  firstName: 'Nome',
  lastName: 'Sobrenome',
  password: 'Senha',
}

export const auditLogsColumns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data/Hora' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className='text-nowrap'>
          {date.toLocaleDateString('pt-BR')}{' '}
          {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    },
  },
  {
    accessorKey: 'actionLabel',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ação' />
    ),
    cell: ({ row }) => {
      const action = row.original.action
      const label = row.original.actionLabel
      return (
        <Badge variant={actionBadgeVariant[action] || 'outline'}>
          {label}
        </Badge>
      )
    },
  },
  {
    id: 'author',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Autor' />
    ),
    accessorFn: (row) => `${row.author.firstName} ${row.author.lastName}`,
    cell: ({ row }) => (
      <div className='ps-2'>
        <div className='font-medium'>
          {row.original.author.firstName} {row.original.author.lastName}
        </div>
        <div className='text-xs text-muted-foreground'>
          {row.original.author.email}
        </div>
      </div>
    ),
  },
  {
    id: 'targetUser',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Usuário Afetado' />
    ),
    accessorFn: (row) =>
      `${row.targetUser.firstName} ${row.targetUser.lastName}`,
    cell: ({ row }) => (
      <div className='ps-2'>
        <div className='font-medium'>
          {row.original.targetUser.firstName} {row.original.targetUser.lastName}
        </div>
        <div className='text-xs text-muted-foreground'>
          {row.original.targetUser.email}
        </div>
      </div>
    ),
  },
  {
    id: 'changes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Alterações' />
    ),
    cell: ({ row }) => {
      const changes = row.original.changes as
        | Record<string, { old: unknown; new: unknown }>
        | undefined
      if (!changes || Object.keys(changes).length === 0) {
        return <span className='text-muted-foreground'>—</span>
      }
      return (
        <div className='flex flex-col gap-0.5 text-sm'>
          {Object.entries(changes).map(([field, change]) => (
            <div key={field}>
              <span className='font-medium'>
                {fieldLabels[field] || field}
              </span>
              :{' '}
              <span className='text-muted-foreground line-through'>
                {String(change.old)}
              </span>{' '}
              →{' '}
              <span className='font-medium'>{String(change.new)}</span>
            </div>
          ))}
        </div>
      )
    },
  },
]
