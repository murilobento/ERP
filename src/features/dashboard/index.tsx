import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import {
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { lazy, Suspense } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import { formatCurrency } from '@/features/sales/data/schema'
import { RecentSales } from './components/recent-sales'
import { TopClients } from './components/top-clients'

const Analytics = lazy(() =>
  import('./components/analytics').then((module) => ({
    default: module.Analytics,
  }))
)
const Overview = lazy(() =>
  import('./components/overview').then((module) => ({
    default: module.Overview,
  }))
)

function ChartFallback({ height }: { height: string }) {
  return <div className='w-full animate-pulse rounded-md bg-muted' style={{ height }} />
}

export type MetricsResponse = {
  kpis: {
    totalRevenue: number
    totalCost: number
    grossProfit: number
    openOrders: number
    toReceive: number
  }
  monthly: { month: string; revenue: number; cost: number }[]
  topClients: { name: string; total: number }[]
  recentSales: {
    id: string
    customer: string
    total: number
    status: string
    createdAt: string
  }[]
}

export function Dashboard() {
  useDocumentTitle('Painel')

  const { data: metrics } = useQuery({
    queryKey: queryKeys.dashboard.metrics,
    queryFn: async () => {
      const res = await api.get('/dashboard/metrics')
      return res.data as MetricsResponse
    },
    refetchOnWindowFocus: false,
  })

  const kpis = metrics?.kpis

  return (
    <>
      <PageHeader fixed={false} />

      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Painel Financeiro</h1>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-3'
        >
          <div className='w-full overflow-x-auto'>
            <TabsList>
              <TabsTrigger value='overview'>Visão Geral</TabsTrigger>
              <TabsTrigger value='analytics'>Análises</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-3'>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Card className='border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-xs font-medium text-blue-600 dark:text-blue-400'>
                    Receita Total
                  </CardTitle>
                  <DollarSign className='h-3.5 w-3.5 text-blue-400 dark:text-blue-500' />
                </div>
                <div className='mt-1 text-xl font-bold text-blue-700 dark:text-blue-300'>
                  {formatCurrency(kpis?.totalRevenue ?? 0)}
                </div>
                <p className='text-[11px] text-blue-500 dark:text-blue-400'>
                  Vendas concluídas
                </p>
              </Card>
              <Card className='border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-xs font-medium text-red-600 dark:text-red-400'>
                    Custo Total
                  </CardTitle>
                  <TrendingDown className='h-3.5 w-3.5 text-red-400 dark:text-red-500' />
                </div>
                <div className='mt-1 text-xl font-bold text-red-700 dark:text-red-300'>
                  {formatCurrency(kpis?.totalCost ?? 0)}
                </div>
                <p className='text-[11px] text-red-500 dark:text-red-400'>
                  Compras concluídas
                </p>
              </Card>
              <Card className='border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-xs font-medium text-green-600 dark:text-green-400'>
                    Lucro Bruto
                  </CardTitle>
                  <TrendingUp className='h-3.5 w-3.5 text-green-400 dark:text-green-500' />
                </div>
                <div className='mt-1 text-xl font-bold text-green-700 dark:text-green-300'>
                  {formatCurrency(kpis?.grossProfit ?? 0)}
                </div>
                <p className='text-[11px] text-green-500 dark:text-green-400'>
                  Receita - Custos
                </p>
              </Card>
              <Card className='border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-xs font-medium text-amber-600 dark:text-amber-400'>
                    Pedidos em Aberto
                  </CardTitle>
                  <Clock className='h-3.5 w-3.5 text-amber-400 dark:text-amber-500' />
                </div>
                <div className='mt-1 text-xl font-bold text-amber-700 dark:text-amber-300'>
                  {kpis?.openOrders ?? 0}
                </div>
                <p className='text-[11px] text-amber-500 dark:text-amber-400'>
                  A receber: {formatCurrency(kpis?.toReceive ?? 0)}
                </p>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader className='px-4 py-3'>
                  <CardTitle className='text-sm'>Faturamento Mensal</CardTitle>
                  <CardDescription className='text-xs'>
                    Receita vs Custo nos últimos 12 meses
                  </CardDescription>
                </CardHeader>
                <CardContent className='px-2 pb-3'>
                  <Suspense fallback={<ChartFallback height='250px' />}>
                    <Overview data={metrics?.monthly ?? []} />
                  </Suspense>
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader className='px-4 py-3'>
                  <CardTitle className='text-sm'>Top Clientes</CardTitle>
                  <CardDescription className='text-xs'>
                    Maiores compradores por faturamento
                  </CardDescription>
                </CardHeader>
                <CardContent className='px-4 pb-3'>
                  <TopClients clients={metrics?.topClients ?? []} />
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-7'>
                <CardHeader className='px-4 py-3'>
                  <CardTitle className='text-sm'>Últimas Vendas</CardTitle>
                  <CardDescription className='text-xs'>
                    Vendas mais recentes registradas
                  </CardDescription>
                </CardHeader>
                <CardContent className='px-4 pb-3'>
                  <RecentSales sales={metrics?.recentSales ?? []} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-3'>
            <Suspense fallback={<ChartFallback height='220px' />}>
              <Analytics />
            </Suspense>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
