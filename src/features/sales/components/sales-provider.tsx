import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Sale, type SaleStatus } from '../data/schema'

type SalesDialogType = 'add' | 'view' | 'edit' | 'best-selling'
export type SalesKanbanAction = {
  sale: Sale
  targetStatus: SaleStatus
}

type SalesContextType = {
  open: SalesDialogType | null
  setOpen: (str: SalesDialogType | null) => void
  currentRow: Sale | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Sale | null>>
  kanbanAction: SalesKanbanAction | null
  setKanbanAction: React.Dispatch<
    React.SetStateAction<SalesKanbanAction | null>
  >
}

const SalesContext = React.createContext<SalesContextType | null>(null)

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<SalesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Sale | null>(null)
  const [kanbanAction, setKanbanAction] = useState<SalesKanbanAction | null>(
    null
  )

  return (
    <SalesContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        kanbanAction,
        setKanbanAction,
      }}
    >
      {children}
    </SalesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSales = () => {
  const salesContext = React.useContext(SalesContext)
  if (!salesContext) {
    throw new Error('useSales has to be used within <SalesContext>')
  }
  return salesContext
}
