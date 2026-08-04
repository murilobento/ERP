import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { ClientsDialogs } from './components/clients-dialogs'
import { ClientsPrimaryButtons } from './components/clients-primary-buttons'
import { ClientsProvider } from './components/clients-provider'
import { ClientsTable } from './components/clients-table'
import { type Client } from './data/schema'

const route = getRouteApi('/_authenticated/clients/')

export function Clients() {
  useDocumentTitle('Clientes')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: clients = [] } = useQuery({
    queryKey: queryKeys.clients,
    queryFn: async () => {
      const res = await api.get('/clients')
      return res.data.clients as Client[]
    },
  })

  return (
    <ClientsProvider>
      <PageHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Lista de Clientes
            </h2>
            <p className='text-muted-foreground'>
              Gerencie seus clientes aqui.
            </p>
          </div>
          <ClientsPrimaryButtons />
        </div>
        <ClientsTable data={clients} search={search} navigate={navigate} />
      </Main>

      <ClientsDialogs />
    </ClientsProvider>
  )
}
