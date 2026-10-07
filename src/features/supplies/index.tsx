import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { InfoIcon } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useDocumentTitle } from '@/hooks/use-document-title'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
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
    queryKey: queryKeys.supplies,
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
            <div className='flex items-center gap-1.5'>
              <h2 className='text-2xl font-bold tracking-tight'>Insumos</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    aria-label='Como o custo do insumo é calculado'
                    className='inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                  >
                    <InfoIcon className='size-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent className='max-w-72'>
                  <p>
                    O custo do insumo é a média do preço por unidade das 3
                    últimas compras concluídas. É recalculado ao concluir ou
                    estornar uma compra, e afeta os preços dos produtos
                    derivados.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
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
