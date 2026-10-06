import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('confirms with a single button click, without typing the category name', async () => {
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    expect(confirm).toBeEnabled()

    // nenhum campo de digitação para confirmar a exclusão
    expect(
      document.querySelector(
        'input[placeholder="Digite o nome para confirmar a exclusão."]'
      )
    ).toBeNull()
  })

  it('deletes the category and invalidates the categories query', async () => {
    const onOpenChange = vi.fn()
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

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

    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Algo deu errado!')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
