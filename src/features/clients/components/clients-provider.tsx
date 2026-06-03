import { createEntityProvider } from '@/features/shared/create-entity-provider'
import { type Client } from '../data/schema'

type ClientsDialogType = 'add' | 'edit' | 'delete'

const { Provider: ClientsProvider, useEntity: useClients } =
  createEntityProvider<Client, ClientsDialogType>('Clients')

// eslint-disable-next-line react-refresh/only-export-components
export { ClientsProvider, useClients }
