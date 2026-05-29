import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.email) return

    try {
      await api.delete(`/users/${currentRow.id}`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário excluído com sucesso.')
      onOpenChange(false)
    } catch {
      toast.error('Falha ao excluir usuário.')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='users-delete-form'
      disabled={value.trim() !== currentRow.email}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Excluir Usuário
        </span>
      }
      desc={
        <form
          id='users-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Tem certeza que deseja excluir{' '}
            <span className='font-bold'>{currentRow.email}</span>?
            <br />
            Esta ação removerá permanentemente o usuário do sistema. Isso não pode ser desfeito.
          </p>

          <Label className='my-2'>
            E-mail:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Digite o e-mail para confirmar a exclusão.'
              autoFocus
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Tenha cuidado, esta operação não pode ser desfeita.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='Excluir'
      destructive
    />
  )
}
