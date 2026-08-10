import { useState } from 'react'
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
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
import { paymentMethodMap } from '../data/schema'

const actionCopy = {
  'ready-for-delivery': {
    title: 'Marcar como pronto para entrega?',
    description: 'A venda seguirá para a etapa de pronto para entrega.',
    button: 'Confirmar',
  },
  deliver: {
    title: 'Confirmar entrega da venda?',
    description: 'Os produtos serão baixados do estoque nesta etapa.',
    button: 'Confirmar Entrega',
  },
  complete: {
    title: 'Concluir venda?',
    description: 'Informe o pagamento para finalizar a venda.',
    button: 'Confirmar Conclusão',
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

type SaleConfirmActionProps = {
  action: 'ready-for-delivery' | 'deliver'
  isLoading: boolean
  onConfirm: (action: string) => void
  onBack: () => void
}

export function SaleConfirmAction({
  action,
  isLoading,
  onConfirm,
  onBack,
}: SaleConfirmActionProps) {
  return (
    <>
      <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
        <p className='font-medium text-green-600 dark:text-green-400'>
          {actionCopy[action].title}
        </p>
        <p className='mt-1 text-muted-foreground'>
          {actionCopy[action].description}
        </p>
      </div>
      <DialogFooter className='gap-2'>
        <Button variant='outline' onClick={onBack} disabled={isLoading}>
          Voltar
        </Button>
        <Button onClick={() => onConfirm(action)} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <CheckCircle2 size={16} className='me-1' />
          )}
          {actionCopy[action].button}
        </Button>
      </DialogFooter>
    </>
  )
}

type SaleCompletePanelProps = {
  isLoading: boolean
  onComplete: (data: {
    paymentMethod: string
    paidAt: string
    paymentNotes: string
  }) => void
  onCancel: () => void
}

export function SaleCompletePanel({
  isLoading,
  onComplete,
  onCancel,
}: SaleCompletePanelProps) {
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paidAt, setPaidAt] = useState(toDateTimeLocal(new Date()))
  const [paymentNotes, setPaymentNotes] = useState('')

  function handleSubmit() {
    if (!paymentMethod || !paidAt) {
      toast.error('Informe a forma e a data do pagamento.')
      return
    }
    onComplete({ paymentMethod, paidAt, paymentNotes })
  }

  return (
    <>
      <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
        <p className='font-medium text-green-600 dark:text-green-400'>
          Concluir venda?
        </p>
        <p className='mt-1 text-muted-foreground'>
          Informe o pagamento para finalizar a venda.
        </p>
      </div>
      <div className='grid gap-3 rounded-md border p-3'>
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
            onSelect={(date) => setPaidAt(setDatePreservingTime(date, paidAt))}
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
      <DialogFooter className='gap-2'>
        <Button variant='outline' onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <CheckCircle2 size={16} className='me-1' />
          )}
          Confirmar Conclusão
        </Button>
      </DialogFooter>
    </>
  )
}

type SaleReversePanelProps = {
  isLoading: boolean
  onReverse: (reason: string) => void
  onCancel: () => void
}

export function SaleReversePanel({
  isLoading,
  onReverse,
  onCancel,
}: SaleReversePanelProps) {
  const [reverseReason, setReverseReason] = useState('')

  function handleSubmit() {
    if (!reverseReason.trim()) {
      toast.error('Informe o motivo do estorno.')
      return
    }
    onReverse(reverseReason.trim())
  }

  return (
    <>
      <div className='rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm'>
        <p className='font-medium text-destructive'>
          Confirmar estorno da venda?
        </p>
        <p className='mt-1 text-muted-foreground'>
          A venda voltará para em preparo e os produtos serão devolvidos ao
          estoque.
        </p>
      </div>
      <div className='space-y-2 rounded-md border border-destructive/50 p-3'>
        <Label className='text-sm font-medium text-destructive'>
          Motivo do Estorno *
        </Label>
        <Input
          placeholder='Informe o motivo do estorno...'
          value={reverseReason}
          onChange={(e) => setReverseReason(e.target.value)}
          autoFocus
        />
      </div>
      <DialogFooter className='gap-2'>
        <Button variant='outline' onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='destructive'
          onClick={handleSubmit}
          disabled={isLoading || !reverseReason.trim()}
        >
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <RotateCcw size={16} className='me-1' />
          )}
          Confirmar Estorno
        </Button>
      </DialogFooter>
    </>
  )
}
