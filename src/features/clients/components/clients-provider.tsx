import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Client } from '../data/schema'

type ClientsDialogType = 'add' | 'edit' | 'delete'

type ClientsContextType = {
  open: ClientsDialogType | null
  setOpen: (str: ClientsDialogType | null) => void
  currentRow: Client | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Client | null>>
}

const ClientsContext = React.createContext<ClientsContextType | null>(null)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ClientsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Client | null>(null)

  return (
    <ClientsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ClientsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useClients = () => {
  const clientsContext = React.useContext(ClientsContext)

  if (!clientsContext) {
    throw new Error('useClients has to be used within <ClientsContext>')
  }

  return clientsContext
}
