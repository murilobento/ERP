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
import { KitsDialogs } from './components/kits-dialogs'
import { KitsPrimaryButtons } from './components/kits-primary-buttons'
import { KitsProvider } from './components/kits-provider'
import { KitsTable } from './components/kits-table'
import { type Kit } from './data/schema'

const route = getRouteApi('/_authenticated/kits/')

export function Kits() {
  useDocumentTitle('Kits')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: kits = [] } = useQuery({
    queryKey: ['kits'],
    queryFn: async () => {
      const res = await api.get('/kits')
      return res.data.kits as Kit[]
    },
  })

  return (
    <KitsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Kits</h2>
            <p className='text-muted-foreground'>
              Gerencie kits de produtos com desconto.
            </p>
          </div>
          <KitsPrimaryButtons />
        </div>
        <KitsTable data={kits} search={search} navigate={navigate} />
      </Main>

      <KitsDialogs />
    </KitsProvider>
  )
}
