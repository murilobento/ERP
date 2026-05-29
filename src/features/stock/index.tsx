import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { StockBalancesTable } from './components/stock-balances-table'
import { StockMovementsTable } from './components/stock-movements-table'
import { type StockBalance, type StockMovement } from './data/schema'

const route = getRouteApi('/_authenticated/stock/')

export function Stock() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: balances = [] } = useQuery({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const res = await api.get('/stock/balances')
      return res.data.balances as StockBalance[]
    },
  })

  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const res = await api.get('/stock/movements')
      return res.data.movements as StockMovement[]
    },
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Estoque</h2>
          <p className='text-muted-foreground'>
            Visão geral do estoque de produtos e insumos.
          </p>
        </div>

        <div>
          <h3 className='mb-3 text-lg font-semibold'>Saldos</h3>
          <StockBalancesTable data={balances} />
        </div>

        <div>
          <h3 className='mb-3 text-lg font-semibold'>Movimentações Recentes</h3>
          <StockMovementsTable data={movements} search={search} navigate={navigate} />
        </div>
      </Main>
    </>
  )
}
