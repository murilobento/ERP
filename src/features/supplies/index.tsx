import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { SuppliesDialogs } from './components/supplies-dialogs'
import { SuppliesPrimaryButtons } from './components/supplies-primary-buttons'
import { SuppliesProvider } from './components/supplies-provider'
import { SuppliesTable } from './components/supplies-table'
import { type SupplyWithStock } from './data/schema'

const route = getRouteApi('/_authenticated/supplies/')

export function Supplies() {
  useDocumentTitle('Insumos')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies'],
    queryFn: async () => {
      const res = await api.get('/supplies')
      return res.data.supplies as SupplyWithStock[]
    },
  })

  return (
    <SuppliesProvider>
      <PageHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Insumos</h2>
            <p className='text-muted-foreground'>
              Gerencie seus insumos e matérias-primas.
            </p>
          </div>
          <SuppliesPrimaryButtons />
        </div>
        <SuppliesTable data={supplies} search={search} navigate={navigate} />
      </Main>

      <SuppliesDialogs />
    </SuppliesProvider>
  )
}
