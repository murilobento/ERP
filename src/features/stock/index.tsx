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
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { AdjustmentsDialogs } from './components/adjustments-dialogs'
import { AdjustmentsFilters } from './components/adjustments-filters'
import { AdjustmentsPrimaryButtons } from './components/adjustments-primary-buttons'
import { AdjustmentsProvider } from './components/adjustments-provider'
import { AdjustmentsTable } from './components/adjustments-table'
import { filterAdjustments } from './data/filters'
import { type StockAdjustment } from './data/schema'

const route = getRouteApi('/_authenticated/stock/')

export function Stock() {
  useDocumentTitle('Acerto de Estoque')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: adjustments = [] } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => {
      const res = await api.get('/stock/adjustments')
      return res.data.adjustments as StockAdjustment[]
    },
  })

  const filteredAdjustments = useMemo(
    () => filterAdjustments(adjustments, search),
    [adjustments, search]
  )

  return (
    <AdjustmentsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Acerto de Estoque</h2>
            <p className='text-muted-foreground'>
              Gerencie os acertos manuais de estoque.
            </p>
          </div>
          <AdjustmentsPrimaryButtons />
        </div>

        <AdjustmentsFilters search={search} navigate={navigate} />

        <AdjustmentsTable
          data={filteredAdjustments}
          search={search}
          navigate={navigate}
        />
      </Main>

      <AdjustmentsDialogs />
    </AdjustmentsProvider>
  )
}
