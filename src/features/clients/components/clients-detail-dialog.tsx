import { useQuery } from '@tanstack/react-query'
import { Loader2, Pen } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  type Client,
  type ClientDetail,
  saleStatusMap,
  getSaleTotal,
  formatCurrency,
} from '../data/schema'
import { useClients } from './clients-provider'

type ClientsDetailDialogProps = {
  currentRow: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientsDetailDialog({
  currentRow,
  open,
  onOpenChange,
}: ClientsDetailDialogProps) {
  const { setOpen } = useClients()
  const currentRowId = currentRow?.id

  const { data: detail, isLoading } = useQuery({
    queryKey: queryKeys.client(currentRowId!),
    queryFn: async () => {
      const res = await api.get<{ client: ClientDetail }>(`/clients/${currentRowId}`)
      return res.data.client
    },
    enabled: open && !!currentRowId,
    staleTime: 0,
  })

  function handleEdit() {
    setOpen('edit')
  }

  function handleClose(state: boolean) {
    if (!state) {
      onOpenChange(state)
    }
  }

  const client = detail ?? currentRow
  const sales = detail?.sales ?? []
  const addressParts = [
    client.street,
    client.number && `nº ${client.number}`,
    client.complement,
    client.neighborhood,
    client.city,
    client.state,
    client.zipCode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>{client.name}</DialogTitle>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <DialogDescription>
            Telefone: {client.phone}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <div className='col-span-2 sm:col-span-3'>
              <p className='text-xs text-muted-foreground'>Endereço</p>
              <p className='text-sm font-medium'>{addressParts || '—'}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <p className='text-xs text-muted-foreground'>Criado em</p>
              <p className='text-sm'>
                {new Date(client.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Atualizado em</p>
              <p className='text-sm'>
                {new Date(client.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h4 className='mb-2 text-sm font-medium'>
              Últimos Pedidos
              {sales.length > 0 && (
                <span className='ms-2 text-xs text-muted-foreground'>
                  ({sales.length})
                </span>
              )}
            </h4>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='size-5 animate-spin text-muted-foreground' />
              </div>
            ) : sales.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Nenhum pedido encontrado.
              </p>
            ) : (
              <div className='rounded-md border'>
                <div className='hidden sm:block'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Entrega</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead className='text-end'>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => {
                        const statusInfo = saleStatusMap[sale.status] ?? {
                          label: sale.status,
                          variant: 'secondary' as const,
                        }
                        const total = getSaleTotal(sale)
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-nowrap'>
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className='text-nowrap'>
                              {sale.deliveryDate
                                ? new Date(sale.deliveryDate).toLocaleDateString()
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <span className='cursor-default underline decoration-dashed underline-offset-4 text-primary'>
                                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className='w-auto min-w-72 p-3'>
                                  <div className='space-y-1.5'>
                                    {sale.items.map((item, i) => (
                                      <div
                                        key={i}
                                        className='flex items-center justify-between text-sm'
                                      >
                                        <span className='text-muted-foreground'>
                                          {item.product.name}
                                        </span>
                                        <span className='font-medium'>
                                          {item.quantity} {item.product.unit} ×{' '}
                                          {formatCurrency(item.unitPrice)}
                                        </span>
                                      </div>
                                    ))}
                                    <div className='mt-1.5 border-t pt-1.5 flex items-center justify-between text-sm font-semibold'>
                                      <span>Total</span>
                                      <span>{formatCurrency(total)}</span>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell className='text-end font-medium'>
                              {formatCurrency(total)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className='space-y-2 p-2 sm:hidden'>
                  {sales.map((sale) => {
                    const statusInfo = saleStatusMap[sale.status] ?? {
                      label: sale.status,
                      variant: 'secondary' as const,
                    }
                    const total = getSaleTotal(sale)
                    return (
                      <div
                        key={sale.id}
                        className='space-y-1 rounded-md border p-3'
                      >
                        <div className='flex items-center justify-between'>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                          <span className='text-sm font-semibold'>
                            {formatCurrency(total)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        {sale.items.length > 0 && (
                          <div className='mt-1 space-y-0.5'>
                            {sale.items.map((item, i) => (
                              <div
                                key={i}
                                className='flex justify-between text-xs'
                              >
                                <span className='text-muted-foreground'>
                                  {item.product.name}
                                </span>
                                <span>
                                  {item.quantity} {item.product.unit} ×{' '}
                                  {formatCurrency(item.unitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button onClick={handleEdit}>
            <Pen size={16} className='me-1' />
            Editar
          </Button>
          <Button variant='outline' onClick={() => handleClose(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
