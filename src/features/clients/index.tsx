import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { ClientsDialogs } from './components/clients-dialogs'
import { ClientsPrimaryButtons } from './components/clients-primary-buttons'
import { ClientsProvider } from './components/clients-provider'
import { ClientsTable } from './components/clients-table'
import { type Client } from './data/schema'

const route = getRouteApi('/_authenticated/clients/')

export function Clients() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients')
      return res.data.clients as Client[]
    },
  })

  return (
    <ClientsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Lista de Clientes</h2>
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
