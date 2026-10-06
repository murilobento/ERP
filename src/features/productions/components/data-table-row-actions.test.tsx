import { type Row } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Production } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const productionsState = vi.hoisted(() => ({
  setOpen: vi.fn(),
  setCurrentRow: vi.fn(),
}))

vi.mock('./productions-provider', () => ({
  useProductions: () => productionsState,
}))

const baseProduction = {
  id: 'production-1',
  status: 'in_production',
} as Production

async function clickAction(status: Production['status'], label: string) {
  const production = { ...baseProduction, status }
  const { getByRole } = render(
    <DataTableRowActions row={{ original: production } as Row<Production>} />
  )

  await userEvent.click(getByRole('button', { name: 'Abrir menu' }))
  await userEvent.click(getByRole('menuitem', { name: new RegExp(label) }))
  return production
}

describe('Productions row actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['in_production', 'Concluir', 'complete'],
    ['in_production', 'Cancelar', 'cancel'],
    ['completed', 'Estornar', 'reverse'],
  ] as const)(
    'opens the %s production action from the row menu',
    async (status, label, action) => {
      const production = await clickAction(status, label)

      expect(productionsState.setCurrentRow).toHaveBeenCalledWith(production)
      expect(productionsState.setOpen).toHaveBeenCalledWith(action)
    }
  )
})
