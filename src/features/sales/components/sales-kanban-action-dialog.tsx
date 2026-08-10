import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import {
  formatDateTimeLocalInAppTimeZone,
  parseDateTimeLocalInAppTimeZone,
} from '@/features/shared/filter-date-utils'
import {
  paymentMethodMap,
  saleStatusMap,
  type Sale,
  type SaleStatus,
} from '../data/schema'
import { useSales } from './sales-provider'

type SaleResponse = {
  sale: Sale
}

const transitionMap: Partial<
  Record<
    SaleStatus,
    Partial<
      Record<
        SaleStatus,
        {
          path: string
          title: string
          description: string
          button: string
          kind: 'confirm' | 'payment' | 'reverse'
        }
      >
    >
  >
> = {
  in_preparation: {
    ready_for_delivery: {
      path: 'ready-for-delivery',
      title: 'Marcar como pronto para entrega?',
      description: 'A venda seguirá para a etapa de pronto para entrega.',
      button: 'Confirmar',
      kind: 'confirm',
    },
  },
  ready_for_delivery: {
    delivered: {
      path: 'deliver',
      title: 'Confirmar entrega?',
      description: 'Os produtos serão baixados do estoque.',
      button: 'Confirmar Entrega',
      kind: 'confirm',
    },
  },
  delivered: {
    completed: {
      path: 'complete',
      title: 'Concluir venda?',
      description: 'Informe o pagamento para finalizar a venda.',
      button: 'Confirmar Conclusão',
      kind: 'payment',
    },
  },
  completed: {
    in_preparation: {
      path: 'reverse',
      title: 'Estornar venda?',
      description:
        'A venda voltará para em preparo e os produtos serão devolvidos ao estoque.',
      button: 'Confirmar Estorno',
      kind: 'reverse',
    },
  },
}

function toDateTimeLocal(date: Date) {
  return formatDateTimeLocalInAppTimeZone(date)
}

function parseDateTimeLocal(value: string) {
  return parseDateTimeLocalInAppTimeZone(value)
}

function setDatePreservingTime(date: Date | undefined, currentValue: string) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const time = currentValue.includes('T')
    ? currentValue.slice(currentValue.indexOf('T'))
    : 'T00:00'
  return `${year}-${month}-${day}${time}`
}

export function SalesKanbanActionDialog() {
  const { kanbanAction, setKanbanAction } = useSales()
  const { run, isLoading } = useEntityMutation()
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paidAt, setPaidAt] = useState(toDateTimeLocal(new Date()))
  const [paymentNotes, setPaymentNotes] = useState('')
  const [reverseReason, setReverseReason] = useState('')
  const queryClient = useQueryClient()

  const transition = useMemo(() => {
    if (!kanbanAction) return null
    return transitionMap[kanbanAction.sale.status]?.[kanbanAction.targetStatus]
  }, [kanbanAction])

  if (!kanbanAction || !transition) return null

  const { sale, targetStatus } = kanbanAction
  const activeTransition = transition
  const targetLabel = saleStatusMap[targetStatus].label

  function close() {
    setPaymentMethod('')
    setPaidAt(toDateTimeLocal(new Date()))
    setPaymentNotes('')
    setReverseReason('')
    setKanbanAction(null)
  }

  function syncSale(updatedSale: Sale) {
    queryClient.setQueryData<Sale[]>(queryKeys.sales, (old) =>
      old?.map((item) => (item.id === updatedSale.id ? updatedSale : item))
    )
    queryClient.setQueryData<Sale>(queryKeys.sale(updatedSale.id), updatedSale)
  }

  async function submit(payload?: Record<string, unknown>) {
    await run({
      mutation: async () => {
        const { data } = await api.post<SaleResponse>(
          `/sales/${sale.id}/${activeTransition.path}`,
          payload
        )
        syncSale(data.sale)
      },
      invalidate: [
        queryKeys.sales,
        queryKeys.sale(sale.id),
        ...(activeTransition.path === 'deliver' ||
        activeTransition.path === 'reverse'
          ? [queryKeys.stock.balances, queryKeys.stock.movements]
          : []),
      ],
      successMessage: `Venda movida para ${targetLabel.toLowerCase()}.`,
      onSuccess: () => close(),
    })
  }

  function submitPayment() {
    if (!paymentMethod || !paidAt) {
      toast.error('Informe a forma e a data do pagamento.')
      return
    }
    submit({ paymentMethod, paidAt, paymentNotes })
  }

  function submitReverse() {
    if (!reverseReason.trim()) {
      toast.error('Informe o motivo do estorno.')
      return
    }
    submit({ reason: reverseReason.trim() })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{transition.title}</DialogTitle>
          <DialogDescription>
            {sale.customer} · {transition.description}
          </DialogDescription>
        </DialogHeader>

        {transition.kind === 'payment' && (
          <div className='grid gap-3'>
            <div className='grid gap-2'>
              <Label>Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione...' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodMap).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Data do pagamento</Label>
              <DatePicker
                selected={parseDateTimeLocal(paidAt)}
                onSelect={(date) =>
                  setPaidAt(setDatePreservingTime(date, paidAt))
                }
                placeholder='Selecione a data'
                className='w-full'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Observação</Label>
              <Input
                placeholder='Opcional'
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {transition.kind === 'reverse' && (
          <div className='grid gap-2'>
            <Label className='text-destructive'>Motivo do estorno *</Label>
            <Input
              placeholder='Informe o motivo...'
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={close} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={transition.kind === 'reverse' ? 'destructive' : 'default'}
            onClick={() => {
              if (transition.kind === 'payment') submitPayment()
              else if (transition.kind === 'reverse') submitReverse()
              else submit()
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className='animate-spin' />
            ) : transition.kind === 'reverse' ? (
              <RotateCcw size={16} className='me-1' />
            ) : (
              <CheckCircle2 size={16} className='me-1' />
            )}
            {transition.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
