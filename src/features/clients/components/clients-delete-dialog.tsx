import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Client } from '../data/schema'

type ClientDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Client
}

export function ClientsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: ClientDeleteDialogProps) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return

    try {
      await api.delete(`/clients/${currentRow.id}`)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente excluído com sucesso.')
      onOpenChange(false)
    } catch {
      toast.error('Falha ao excluir cliente.')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='clients-delete-form'
      disabled={value.trim() !== currentRow.name}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Excluir Cliente
        </span>
      }
      desc={
        <form
          id='clients-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Tem certeza que deseja excluir{' '}
            <span className='font-bold'>{currentRow.name}</span>?
            <br />
            Esta ação removerá permanentemente o cliente do sistema. Isso não pode ser desfeito.
          </p>

          <Label className='my-2'>
            Nome:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Digite o nome para confirmar a exclusão.'
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
