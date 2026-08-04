import React, { useState, type ReactNode } from 'react'
import useDialogState from '@/hooks/use-dialog-state'

export type EntityContextType<T, DialogType extends string> = {
  open: DialogType | null
  setOpen: (str: DialogType | null) => void
  currentRow: T | null
  setCurrentRow: React.Dispatch<React.SetStateAction<T | null>>
}

export function createEntityProvider<T, DialogType extends string>(
  contextName: string
) {
  const Context = React.createContext<EntityContextType<T, DialogType> | null>(
    null
  )

  function Provider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useDialogState<DialogType>(null)
    const [currentRow, setCurrentRow] = useState<T | null>(null)

    return (
      <Context value={{ open, setOpen, currentRow, setCurrentRow }}>
        {children}
      </Context>
    )
  }

  function useEntity() {
    const context = React.useContext(Context)
    if (!context) {
      throw new Error(
        `use${contextName} has to be used within <${contextName}Context>`
      )
    }
    return context
  }

  return { Provider, useEntity }
}
