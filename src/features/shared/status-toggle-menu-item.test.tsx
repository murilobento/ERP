import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStatusToggleAction } from './use-status-toggle-action'

const runMutation = vi.hoisted(() =>
  vi.fn(async (options: { mutation: () => Promise<unknown> }) =>
    options.mutation()
  )
)

vi.mock('@/lib/use-entity-mutation', () => ({
  useEntityMutation: () => ({ run: runMutation, isLoading: false }),
}))

function StatusToggleTestMenu({
  onToggle,
}: {
  onToggle: (status: 'active' | 'inactive') => Promise<unknown>
}) {
  const statusAction = useStatusToggleAction({
    entityLabel: 'Produto',
    status: 'active',
    invalidate: [['products']],
    onToggle,
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type='button'>Ações</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={statusAction.openConfirmation}>
            {statusAction.actionLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {statusAction.confirmationDialog}
    </>
  )
}

describe('StatusToggleMenuItem', () => {
  it('confirms and applies the status toggle', async () => {
    const onToggle = vi.fn(async (_status: 'active' | 'inactive') => undefined)
    const { getByRole, getByText } = render(
      <StatusToggleTestMenu onToggle={onToggle} />
    )

    await userEvent.click(getByRole('button', { name: 'Ações' }))
    await userEvent.click(getByRole('menuitem', { name: 'Desativar' }))

    expect(getByText('Desativar produto')).toBeInTheDocument()
    await userEvent.click(getByRole('button', { name: 'Desativar' }))

    await vi.waitFor(() => expect(onToggle).toHaveBeenCalledWith('inactive'))
  })
})
