import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataTableRowActions as CategoriesRowActions } from '@/features/categories/components/data-table-row-actions'
import { type Category } from '@/features/categories/data/schema'
import { DataTableRowActions as KitsRowActions } from '@/features/kits/components/data-table-row-actions'
import { type Kit } from '@/features/kits/data/schema'
import { DataTableRowActions as ProductsRowActions } from '@/features/products/components/data-table-row-actions'
import { type Product } from '@/features/products/data/schema'
import { DataTableRowActions as SuppliesRowActions } from '@/features/supplies/components/data-table-row-actions'
import { type Supply } from '@/features/supplies/data/schema'

const state = vi.hoisted(() => ({
  setOpen: vi.fn(),
  setCurrentRow: vi.fn(),
}))

vi.mock('@/features/categories/components/categories-provider', () => ({
  useCategories: () => state,
}))
vi.mock('@/features/kits/components/kits-provider', () => ({
  useKits: () => state,
}))
vi.mock('@/features/products/components/products-provider', () => ({
  useProducts: () => state,
}))
vi.mock('@/features/supplies/components/supplies-provider', () => ({
  useSupplies: () => state,
}))

async function expectToggleMenuItem(component: React.ReactNode) {
  const queryClient = new QueryClient()
  const { getByRole } = render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  )

  await userEvent.click(getByRole('button', { name: 'Abrir menu' }))
  expect(getByRole('menuitem', { name: 'Desativar' })).toBeInTheDocument()
}

describe('active entity row actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    [
      'products',
      <ProductsRowActions
        row={
          {
            original: { id: 'product-1', status: 'active' } as Product,
          } as Row<Product>
        }
      />,
    ],
    [
      'supplies',
      <SuppliesRowActions
        row={
          {
            original: { id: 'supply-1', status: 'active' } as Supply,
          } as Row<Supply>
        }
      />,
    ],
    [
      'categories',
      <CategoriesRowActions
        row={
          {
            original: { id: 'category-1', status: 'active' } as Category,
          } as Row<Category>
        }
      />,
    ],
    [
      'kits',
      <KitsRowActions
        row={{ original: { id: 'kit-1', status: 'active' } as Kit } as Row<Kit>}
      />,
    ],
  ])('offers Desativar in the %s menu', async (_name, component) => {
    await expectToggleMenuItem(component)
  })
})
