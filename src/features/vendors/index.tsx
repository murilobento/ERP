import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { VendorsDialogs } from './components/vendors-dialogs'
import { VendorsPrimaryButtons } from './components/vendors-primary-buttons'
import { VendorsProvider } from './components/vendors-provider'
import { VendorsTable } from './components/vendors-table'
import { type Vendor } from './data/schema'

const route = getRouteApi('/_authenticated/vendors/')

export function Vendors() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await api.get('/vendors')
      return res.data.vendors as Vendor[]
    },
  })

  return (
    <VendorsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <FullscreenToggle />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Lista de Fornecedores</h2>
            <p className='text-muted-foreground'>
              Gerencie seus fornecedores aqui.
            </p>
          </div>
          <VendorsPrimaryButtons />
        </div>
        <VendorsTable data={vendors} search={search} navigate={navigate} />
      </Main>

      <VendorsDialogs />
    </VendorsProvider>
  )
}
