import { useState } from 'react'
import { type QueryKey } from '@tanstack/react-query'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { ConfirmDialog } from '@/components/confirm-dialog'

type UseStatusToggleActionOptions = {
  entityLabel: string
  grammaticalGender?: 'masculine' | 'feminine'
  status: string
  invalidate: QueryKey[]
  onToggle: (status: 'active' | 'inactive') => Promise<unknown>
}

export function useStatusToggleAction({
  entityLabel,
  grammaticalGender = 'masculine',
  status,
  invalidate,
  onToggle,
}: UseStatusToggleActionOptions) {
  const { run, isLoading } = useEntityMutation()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const isActive = status === 'active'
  const newStatus = isActive ? 'inactive' : 'active'
  const actionLabel = isActive ? 'Desativar' : 'Ativar'
  const pastParticiple = isActive
    ? grammaticalGender === 'feminine'
      ? 'desativada'
      : 'desativado'
    : grammaticalGender === 'feminine'
      ? 'ativada'
      : 'ativado'
  const article = grammaticalGender === 'feminine' ? 'esta' : 'este'

  async function toggleStatus() {
    await run({
      mutation: () => onToggle(newStatus),
      invalidate,
      successMessage: `${entityLabel} ${pastParticiple} com sucesso.`,
      onSuccess: () => setIsConfirmOpen(false),
    })
  }

  return {
    actionLabel,
    isActive,
    openConfirmation: () => setIsConfirmOpen(true),
    confirmationDialog: (
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={`${actionLabel} ${entityLabel.toLowerCase()}`}
        desc={`Tem certeza que deseja ${actionLabel.toLowerCase()} ${article} ${entityLabel.toLowerCase()}?`}
        destructive={isActive}
        isLoading={isLoading}
        handleConfirm={toggleStatus}
        confirmText={actionLabel}
      />
    ),
  }
}
