import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Vendor } from '../data/schema'

type VendorDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Vendor
}

export function VendorsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: VendorDeleteDialogProps) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return

    try {
      await api.delete(`/vendors/${currentRow.id}`)
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Fornecedor excluído com sucesso.')
      onOpenChange(false)
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Falha ao excluir fornecedor.'
      toast.error(message)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='vendors-delete-form'
      disabled={value.trim() !== currentRow.name}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Excluir Fornecedor
        </span>
      }
      desc={
        <form
          id='vendors-delete-form'
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
            Esta ação removerá permanentemente o fornecedor do sistema. Isso não pode ser desfeito.
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
