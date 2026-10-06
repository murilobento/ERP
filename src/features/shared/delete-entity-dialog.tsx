import { type QueryKey } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'

type DeleteableEntity = { id: string; name?: string }

type DeleteEntityDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: DeleteableEntity | null
  endpoint: string
  queryKey: QueryKey
  entityLabel: string
  successMessage: string
  formId: string
  displayLabel?: string
}

export function DeleteEntityDialog({
  open,
  onOpenChange,
  currentRow,
  endpoint,
  queryKey,
  entityLabel,
  successMessage,
  formId,
  displayLabel,
}: DeleteEntityDialogProps) {
  const { run } = useEntityMutation()

  if (!currentRow) return null

  const confirmationName = displayLabel ?? currentRow.name ?? ''
  const recordLabel = confirmationName || 'este registro'

  const handleDelete = async () => {
    await run({
      mutation: () => api.delete(`/${endpoint}/${currentRow.id}`),
      invalidate: [queryKey],
      successMessage,
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form={formId}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Excluir {entityLabel}
        </span>
      }
      desc={
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Tem certeza que deseja excluir{' '}
            <span className='font-bold'>{recordLabel}</span>?
          </p>
          <Alert variant='destructive'>
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Esta operação não pode ser desfeita.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='Excluir'
      destructive
    />
  )
}
