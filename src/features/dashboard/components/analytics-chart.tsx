import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/features/sales/data/schema'

const monthLabels: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
}

function formatMonth(month: string) {
  const parts = month.split('-')
  return monthLabels[parts[1]] ?? month
}

function formatTick(value: number) {
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`
  }
  return `R$${value}`
}

export function AnalyticsChart({
  data,
}: {
  data: { month: string; profit: number }[]
}) {
  const chartData = data.map((d) => ({
    name: formatMonth(d.month),
    Lucro: d.profit,
  }))

  return (
    <ResponsiveContainer width='100%' height={220}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
        <XAxis
          dataKey='name'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatTick}
        />
        <Tooltip
          formatter={((value: number | string) => [formatCurrency(Number(value)), 'Lucro']) as never}
        />
        <Area
          type='monotone'
          dataKey='Lucro'
          stroke='hsl(142, 71%, 45%)'
          fill='hsl(142, 71%, 45%)'
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
