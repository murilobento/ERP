import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export function Overview({
  data,
}: {
  data: { month: string; revenue: number; cost: number }[]
}) {
  const chartData = data.map((d) => ({
    name: formatMonth(d.month),
    Receita: d.revenue,
    Custo: d.cost,
  }))

  return (
    <ResponsiveContainer width='100%' height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
        <XAxis dataKey='name' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatTick}
        />
        <Tooltip
          formatter={
            ((value: number | string, name: string) => [
              formatCurrency(Number(value)),
              name,
            ]) as never
          }
        />
        <Legend />
        <Bar
          dataKey='Receita'
          fill='hsl(217, 91%, 60%)'
          radius={[4, 4, 0, 0]}
        />
        <Bar dataKey='Custo' fill='hsl(0, 84%, 60%)' radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
