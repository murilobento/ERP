import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Supply } from '../data/schema'

type SuppliesDialogType = 'add' | 'edit' | 'delete'

type SuppliesContextType = {
  open: SuppliesDialogType | null
  setOpen: (str: SuppliesDialogType | null) => void
  currentRow: Supply | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Supply | null>>
}

const SuppliesContext = React.createContext<SuppliesContextType | null>(null)

export function SuppliesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<SuppliesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Supply | null>(null)

  return (
    <SuppliesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </SuppliesContext>
  )
}

export const useSupplies = () => {
  const suppliesContext = React.useContext(SuppliesContext)
  if (!suppliesContext) {
    throw new Error('useSupplies has to be used within <SuppliesContext>')
  }
  return suppliesContext
}
