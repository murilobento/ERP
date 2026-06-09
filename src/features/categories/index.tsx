import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { CategoriesDialogs } from './components/categories-dialogs'
import { CategoriesPrimaryButtons } from './components/categories-primary-buttons'
import { CategoriesProvider } from './components/categories-provider'
import { CategoriesTable } from './components/categories-table'
import { type Category } from './data/schema'

const route = getRouteApi('/_authenticated/categories/')

export function Categories() {
  useDocumentTitle('Categorias')
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
      <PageHeader />

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
