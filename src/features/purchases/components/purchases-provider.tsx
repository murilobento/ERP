import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Purchase } from '../data/schema'

type PurchasesDialogType = 'add' | 'view' | 'edit'

type PurchasesContextType = {
  open: PurchasesDialogType | null
  setOpen: (str: PurchasesDialogType | null) => void
  currentRow: Purchase | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Purchase | null>>
}

const PurchasesContext = React.createContext<PurchasesContextType | null>(null)

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<PurchasesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Purchase | null>(null)

  return (
    <PurchasesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PurchasesContext>
  )
}

export const usePurchases = () => {
  const purchasesContext = React.useContext(PurchasesContext)
  if (!purchasesContext) {
    throw new Error('usePurchases has to be used within <PurchasesContext>')
  }
  return purchasesContext
}
