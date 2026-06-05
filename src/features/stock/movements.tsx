import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { StockMovementsFilters } from './components/stock-movements-filters'
import { StockMovementsTable } from './components/stock-movements-table'
import { filterMovements } from './data/filters'
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

  const filteredMovements = useMemo(
    () => filterMovements(movements, search),
    [movements, search]
  )

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <FullscreenToggle />
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

        <StockMovementsFilters search={search} navigate={navigate} />

        <StockMovementsTable data={filteredMovements} search={search} navigate={navigate} />
      </Main>
    </>
  )
}
