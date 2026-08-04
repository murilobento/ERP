import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, DollarSign, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency } from '@/features/sales/data/schema'
import { AnalyticsChart } from './analytics-chart'

const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência',
  boleto: 'Boleto',
  other: 'Outro',
}

const statusLabels: Record<string, string> = {
  in_preparation: 'Em Preparo',
  ready_for_delivery: 'Pronto para Entrega',
  delivered: 'Entregue',
  completed: 'Concluído',
}

export type AnalyticsResponse = {
  byPaymentMethod: { method: string; count: number; total: number }[]
  byStatus: { status: string; count: number; total: number }[]
  monthlyProfit: { month: string; profit: number }[]
  avgTicket: number
  paidPercentage: number
  pendingPercentage: number
  salesThisMonth: number
}

export function Analytics() {
  const { data: analytics } = useQuery({
    queryKey: queryKeys.dashboard.analytics,
    queryFn: async () => {
      const res = await api.get('/dashboard/analytics')
      return res.data as AnalyticsResponse
    },
    refetchOnWindowFocus: false,
  })

  return (
    <div className='space-y-3'>
      <Card>
        <CardHeader className='px-4 py-3'>
          <CardTitle className='text-sm'>Evolução do Lucro Mensal</CardTitle>
          <CardDescription className='text-xs'>
            Lucro bruto (Receita - Custo) nos últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4 pb-3'>
          <AnalyticsChart data={analytics?.monthlyProfit ?? []} />
        </CardContent>
      </Card>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xs font-medium text-green-600 dark:text-green-400'>
              Ticket Médio
            </CardTitle>
            <DollarSign className='h-3.5 w-3.5 text-green-400 dark:text-green-500' />
          </div>
          <div className='mt-1 text-xl font-bold text-green-700 dark:text-green-300'>
            {formatCurrency(analytics?.avgTicket ?? 0)}
          </div>
          <p className='text-[11px] text-green-500 dark:text-green-400'>
            Por venda concluída
          </p>
        </Card>
        <Card className='border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xs font-medium text-blue-600 dark:text-blue-400'>
              % Faturado
            </CardTitle>
            <CheckCircle2 className='h-3.5 w-3.5 text-blue-400 dark:text-blue-500' />
          </div>
          <div className='mt-1 text-xl font-bold text-blue-700 dark:text-blue-300'>
            {(analytics?.paidPercentage ?? 0).toFixed(1)}%
          </div>
          <p className='text-[11px] text-blue-500 dark:text-blue-400'>
            Vendas pagas
          </p>
        </Card>
        <Card className='border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xs font-medium text-amber-600 dark:text-amber-400'>
              % Pendente
            </CardTitle>
            <Clock className='h-3.5 w-3.5 text-amber-400 dark:text-amber-500' />
          </div>
          <div className='mt-1 text-xl font-bold text-amber-700 dark:text-amber-300'>
            {(analytics?.pendingPercentage ?? 0).toFixed(1)}%
          </div>
          <p className='text-[11px] text-amber-500 dark:text-amber-400'>
            A receber
          </p>
        </Card>
        <Card className='border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-950'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xs font-medium text-purple-600 dark:text-purple-400'>
              Vendas no Mês
            </CardTitle>
            <TrendingUp className='h-3.5 w-3.5 text-purple-400 dark:text-purple-500' />
          </div>
          <div className='mt-1 text-xl font-bold text-purple-700 dark:text-purple-300'>
            {analytics?.salesThisMonth ?? 0}
          </div>
          <p className='text-[11px] text-purple-500 dark:text-purple-400'>
            Concluídas este mês
          </p>
        </Card>
      </div>
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader className='px-4 py-3'>
            <CardTitle className='text-sm'>Por Método de Pagamento</CardTitle>
            <CardDescription className='text-xs'>
              Distribuição das vendas concluídas
            </CardDescription>
          </CardHeader>
          <CardContent className='px-4 pb-3'>
            <SimpleBarList
              items={(analytics?.byPaymentMethod ?? []).map((p) => ({
                name: paymentMethodLabels[p.method] ?? p.method,
                value: p.total,
              }))}
              barClass='bg-primary'
              valueFormatter={(n) => formatCurrency(n)}
            />
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
          <CardHeader className='px-4 py-3'>
            <CardTitle className='text-sm'>Por Status da Venda</CardTitle>
            <CardDescription className='text-xs'>
              Quantidade e valor por status
            </CardDescription>
          </CardHeader>
          <CardContent className='px-4 pb-3'>
            <SimpleBarList
              items={(analytics?.byStatus ?? []).map((s) => ({
                name: statusLabels[s.status] ?? s.status,
                value: s.count,
              }))}
              barClass='bg-muted-foreground'
              valueFormatter={(n) => `${n} vendas`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SimpleBarList({
  items,
  valueFormatter,
  barClass,
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
  barClass: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className='space-y-2'>
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-0.5 truncate text-xs text-muted-foreground'>
                {i.name}
              </div>
              <div className='h-1.5 w-full rounded-full bg-muted'>
                <div
                  className={`h-1.5 rounded-full ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className='ps-2 text-xs font-medium tabular-nums'>
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
