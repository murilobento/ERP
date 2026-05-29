import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { PurchasesDialogs } from './components/purchases-dialogs'
import { PurchasesPrimaryButtons } from './components/purchases-primary-buttons'
import { PurchasesProvider } from './components/purchases-provider'
import { PurchasesTable } from './components/purchases-table'
import { type Purchase } from './data/schema'

const route = getRouteApi('/_authenticated/purchases/')

export function Purchases() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await api.get('/purchases')
      return res.data.purchases as Purchase[]
    },
  })

  return (
    <PurchasesProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Compras</h2>
            <p className='text-muted-foreground'>
              Gerencie as compras de insumos.
            </p>
          </div>
          <PurchasesPrimaryButtons />
        </div>
        <PurchasesTable data={purchases} search={search} navigate={navigate} />
      </Main>

      <PurchasesDialogs />
    </PurchasesProvider>
  )
}
