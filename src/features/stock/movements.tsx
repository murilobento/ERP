import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { StockMovementsTable } from './components/stock-movements-table'
import { type StockMovement } from './data/schema'

export function StockMovements() {
  const search = useSearch({ strict: false })
  const routerNavigate = useNavigate()
  const navigate = routerNavigate as unknown as NavigateFn

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
          <h2 className='text-2xl font-bold tracking-tight'>Movimentações de Estoque</h2>
          <p className='text-muted-foreground'>
            Consulte entradas, saídas, estornos e ajustes manuais.
          </p>
        </div>

        <StockMovementsTable data={movements} search={search} navigate={navigate} />
      </Main>
    </>
  )
}
