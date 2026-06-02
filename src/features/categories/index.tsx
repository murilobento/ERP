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
import { CategoriesDialogs } from './components/categories-dialogs'
import { CategoriesPrimaryButtons } from './components/categories-primary-buttons'
import { CategoriesProvider } from './components/categories-provider'
import { CategoriesTable } from './components/categories-table'
import { type Category } from './data/schema'

const route = getRouteApi('/_authenticated/categories/')

export function Categories() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories')
      return res.data.categories as Category[]
    },
  })

  return (
    <CategoriesProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Categorias</h2>
            <p className='text-muted-foreground'>
              Gerencie as categorias dos seus produtos.
            </p>
          </div>
          <CategoriesPrimaryButtons />
        </div>
        <CategoriesTable data={categories} search={search} navigate={navigate} />
      </Main>

      <CategoriesDialogs />
    </CategoriesProvider>
  )
}
