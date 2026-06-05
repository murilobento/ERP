import { useMemo } from 'react'
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
import { ProductionsDialogs } from './components/productions-dialogs'
import { ProductionsFilters } from './components/productions-filters'
import { ProductionsPrimaryButtons } from './components/productions-primary-buttons'
import { ProductionsProvider } from './components/productions-provider'
import { ProductionsTable } from './components/productions-table'
import { filterProductions } from './data/filters'
import { type Production } from './data/schema'

const route = getRouteApi('/_authenticated/productions/')

export function Productions() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: productions = [] } = useQuery({
    queryKey: ['productions'],
    queryFn: async () => {
      const res = await api.get('/productions')
      return res.data.productions as Production[]
    },
  })

  const filteredProductions = useMemo(
    () => filterProductions(productions, search),
    [productions, search]
  )

  return (
    <ProductionsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Produções</h2>
            <p className='text-muted-foreground'>
              Gerencie as ordens de produção.
            </p>
          </div>
          <ProductionsPrimaryButtons />
        </div>

        <ProductionsFilters search={search} navigate={navigate} />

        <ProductionsTable data={filteredProductions} search={search} navigate={navigate} />
      </Main>

      <ProductionsDialogs />
    </ProductionsProvider>
  )
}
