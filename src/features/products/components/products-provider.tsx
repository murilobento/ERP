import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Product } from '../data/schema'

type ProductsDialogType = 'add' | 'edit' | 'delete' | 'composition'

type ProductsContextType = {
  open: ProductsDialogType | null
  setOpen: (str: ProductsDialogType | null) => void
  currentRow: Product | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Product | null>>
}

const ProductsContext = React.createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ProductsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Product | null>(null)

  return (
    <ProductsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProductsContext>
  )
}

export const useProducts = () => {
  const productsContext = React.useContext(ProductsContext)
  if (!productsContext) {
    throw new Error('useProducts has to be used within <ProductsContext>')
  }
  return productsContext
}
