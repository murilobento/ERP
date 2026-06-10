import { formatCurrency } from '@/features/sales/data/schema'

export function TopClients({
  clients,
}: {
  clients: { name: string; total: number }[]
}) {
  if (clients.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        Nenhum cliente com vendas concluídas.
      </p>
    )
  }

  const max = Math.max(...clients.map((c) => c.total), 1)

  return (
    <ul className='space-y-2'>
      {clients.map((client, index) => {
        const width = `${Math.round((client.total / max) * 100)}%`
        return (
          <li key={client.name + index} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-0.5 flex items-center gap-2'>
                <span className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground'>
                  {index + 1}
                </span>
                <span className='truncate text-xs font-medium'>
                  {client.name}
                </span>
              </div>
              <div className='h-1.5 w-full rounded-full bg-muted'>
                <div
                  className='h-1.5 rounded-full bg-primary'
                  style={{ width }}
                />
              </div>
            </div>
            <div className='ps-2 text-xs font-medium tabular-nums'>
              {formatCurrency(client.total)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
