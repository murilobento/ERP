import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Category } from '../data/schema'
import { CategoriesDeleteDialog } from './categories-delete-dialog'

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

const category: Category = {
  id: 'category-1',
  name: 'Bolos',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  _count: { products: 2 },
}

function confirmationInput() {
  return document.querySelector<HTMLInputElement>(
    'input[placeholder="Digite o nome para confirmar a exclusão."]'
  )!
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof CategoriesDeleteDialog>> = {}
) {
  const queryClient = new QueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <CategoriesDeleteDialog
        open
        onOpenChange={vi.fn()}
        currentRow={category}
        {...props}
      />
    </QueryClientProvider>
  )

  return { rendered, invalidateQueries }
}

describe('CategoriesDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('keeps delete disabled until the category name matches', async () => {
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    await expect.element(confirm).toBeDisabled()
    await userEvent.type(confirmationInput(), 'Tortas')
    await expect.element(confirm).toBeDisabled()
  })

  it('deletes the category and invalidates the categories query', async () => {
    const onOpenChange = vi.fn()
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'Bolos')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/categories/category-1')
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['categories'] })
    expect(toastSuccess).toHaveBeenCalledWith('Categoria excluída com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('falls back to the generic category error message', async () => {
    const onOpenChange = vi.fn()
    apiDelete.mockRejectedValueOnce(new Error('network'))
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'Bolos')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Falha ao excluir categoria.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
