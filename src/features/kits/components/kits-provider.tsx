import React, { useState, type ReactNode } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Kit } from '../data/schema'

type DialogType = 'add' | 'edit' | 'delete' | 'view'

export type KitsContextType = {
  open: DialogType | null
  setOpen: (str: DialogType | null) => void
  currentRow: Kit | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Kit | null>>
}

const KitsContext = React.createContext<KitsContextType | null>(null)

export function KitsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useDialogState<DialogType>(null)
  const [currentRow, setCurrentRow] = useState<Kit | null>(null)

  return (
    <KitsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </KitsContext>
  )
}

export function useKits() {
  const context = React.useContext(KitsContext)
  if (!context) {
    throw new Error('useKits has to be used within <KitsContext>')
  }
  return context
}
