import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { PurchasesDialogs } from './components/purchases-dialogs'
import { PurchasesFilters } from './components/purchases-filters'
import { PurchasesPrimaryButtons } from './components/purchases-primary-buttons'
import { PurchasesProvider } from './components/purchases-provider'
import { PurchasesTable } from './components/purchases-table'
import { filterPurchases } from './data/filters'
import { type Purchase } from './data/schema'

const route = getRouteApi('/_authenticated/purchases/')

export function Purchases() {
  useDocumentTitle('Compras')
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await api.get('/purchases')
      return res.data.purchases as Purchase[]
    },
  })

  const filteredPurchases = useMemo(
    () => filterPurchases(purchases, search),
    [purchases, search]
  )

  return (
    <PurchasesProvider>
      <PageHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Compras</h2>
            <p className='text-muted-foreground'>
              Gerencie as compras de insumos.
            </p>
          </div>
          <PurchasesPrimaryButtons />
        </div>

        <PurchasesFilters search={search} navigate={navigate} />

        <PurchasesTable
          data={filteredPurchases}
          search={search}
          navigate={navigate}
        />
      </Main>

      <PurchasesDialogs />
    </PurchasesProvider>
  )
}
