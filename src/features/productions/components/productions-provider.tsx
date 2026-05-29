import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Production } from '../data/schema'

type ProductionsDialogType = 'add' | 'view' | 'delete'

type ProductionsContextType = {
  open: ProductionsDialogType | null
  setOpen: (str: ProductionsDialogType | null) => void
  currentRow: Production | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Production | null>>
}

const ProductionsContext = React.createContext<ProductionsContextType | null>(null)

export function ProductionsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ProductionsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Production | null>(null)

  return (
    <ProductionsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProductionsContext>
  )
}

export const useProductions = () => {
  const productionsContext = React.useContext(ProductionsContext)
  if (!productionsContext) {
    throw new Error('useProductions has to be used within <ProductionsContext>')
  }
  return productionsContext
}
