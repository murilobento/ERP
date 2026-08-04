import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { VendorsDialogs } from './components/vendors-dialogs'
import { VendorsPrimaryButtons } from './components/vendors-primary-buttons'
import { VendorsProvider } from './components/vendors-provider'
import { VendorsTable } from './components/vendors-table'
import { type Vendor } from './data/schema'

const route = getRouteApi('/_authenticated/vendors/')

export function Vendors() {
  useDocumentTitle('Fornecedores')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: vendors = [] } = useQuery({
    queryKey: queryKeys.vendors,
    queryFn: async () => {
      const res = await api.get('/vendors')
      return res.data.vendors as Vendor[]
    },
  })

  return (
    <VendorsProvider>
      <PageHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Lista de Fornecedores
            </h2>
            <p className='text-muted-foreground'>
              Gerencie seus fornecedores aqui.
            </p>
          </div>
          <VendorsPrimaryButtons />
        </div>
        <VendorsTable data={vendors} search={search} navigate={navigate} />
      </Main>

      <VendorsDialogs />
    </VendorsProvider>
  )
}
