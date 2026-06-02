import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Client } from '../data/schema'
import { ClientsDeleteDialog } from './clients-delete-dialog'

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

const client: Client = {
  id: 'client-1',
  name: 'Cliente Bom',
  phone: '(11) 99999-8888',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function confirmationInput() {
  return document.querySelector<HTMLInputElement>(
    'input[placeholder="Digite o nome para confirmar a exclusão."]'
  )!
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof ClientsDeleteDialog>> = {}
) {
  const queryClient = new QueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <ClientsDeleteDialog
        open
        onOpenChange={vi.fn()}
        currentRow={client}
        {...props}
      />
    </QueryClientProvider>
  )

  return { rendered, invalidateQueries }
}

describe('ClientsDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('keeps delete disabled until the client name matches', async () => {
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    await expect.element(confirm).toBeDisabled()

    await userEvent.type(confirmationInput(), 'Outro Cliente')
    await expect.element(confirm).toBeDisabled()
    expect(apiDelete).not.toHaveBeenCalled()
  })

  it('deletes the client, invalidates cache and closes the dialog', async () => {
    const onOpenChange = vi.fn()
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'Cliente Bom')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/clients/client-1')
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['clients'] })
    expect(toastSuccess).toHaveBeenCalledWith('Cliente excluído com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows backend errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiDelete.mockRejectedValueOnce({
      response: { data: { error: 'Cliente vinculado a vendas.' } },
    })
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'Cliente Bom')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Cliente vinculado a vendas.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
