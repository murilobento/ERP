import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { ProductsDialogs } from './components/products-dialogs'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import { ProductsProvider } from './components/products-provider'
import { ProductsTable } from './components/products-table'
import { type Product } from './data/schema'

const route = getRouteApi('/_authenticated/products/')

export function Products() {
  useDocumentTitle('Produtos')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data.products as Product[]
    },
  })

  return (
    <ProductsProvider>
      <PageHeader />

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
