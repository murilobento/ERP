import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import api from '@/lib/api'
import { ProductsDialogs } from './components/products-dialogs'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import { ProductsProvider } from './components/products-provider'
import { ProductsTable } from './components/products-table'
import { type Product } from './data/schema'

const route = getRouteApi('/_authenticated/products/')

export function Products() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data.products as Product[]
    },
  })

  return (
    <ProductsProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Produtos</h2>
            <p className='text-muted-foreground'>
              Gerencie seus produtos e suas composições.
            </p>
          </div>
          <ProductsPrimaryButtons />
        </div>
        <ProductsTable data={products} search={search} navigate={navigate} />
      </Main>

      <ProductsDialogs />
    </ProductsProvider>
  )
}
