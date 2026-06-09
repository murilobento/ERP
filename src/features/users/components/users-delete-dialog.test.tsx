import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type User } from '../data/schema'
import { UsersDeleteDialog } from './users-delete-dialog'

const apiDelete = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    delete: apiDelete,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}))

const user: User = {
  id: 'user-1',
  firstName: 'Murilo',
  lastName: 'Silva',
  email: 'murilo@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function confirmationInput() {
  return document.querySelector<HTMLInputElement>(
    'input[placeholder="Digite o e-mail para confirmar a exclusão."]'
  )!
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof UsersDeleteDialog>> = {}
) {
  const queryClient = new QueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <UsersDeleteDialog
        open
        onOpenChange={vi.fn()}
        currentRow={user}
        {...props}
      />
    </QueryClientProvider>
  )

  return { rendered, invalidateQueries }
}

describe('UsersDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('keeps delete disabled until the user email matches', async () => {
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    await expect.element(confirm).toBeDisabled()

    await userEvent.type(confirmationInput(), 'outro@example.com')
    await expect.element(confirm).toBeDisabled()
  })

  it('deletes the user and invalidates the users query', async () => {
    const onOpenChange = vi.fn()
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'murilo@example.com')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/users/user-1')
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(toastSuccess).toHaveBeenCalledWith('Usuário excluído com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('falls back to the generic error message', async () => {
    const onOpenChange = vi.fn()
    apiDelete.mockRejectedValueOnce(new Error('network'))
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'murilo@example.com')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Algo deu errado!')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
