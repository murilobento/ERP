import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { queryKeys } from '@/lib/query-keys'
import api from '@/lib/api'
import {
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAdjustments } from './adjustments-provider'

const adjustmentSchema = z.object({
  itemType: z.enum(['product', 'supply']),
  itemId: z.string().min(1, 'Item é obrigatório.'),
  quantity: z
    .number()
    .refine((value) => value !== 0, {
      message: 'Quantidade deve ser diferente de zero.',
    }),
  reason: z.string().min(1, 'Motivo é obrigatório.'),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

type AdjustmentsActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdjustmentsActionDialog({
  open,
  onOpenChange,
}: AdjustmentsActionDialogProps) {
  const { run, isLoading } = useEntityMutation()
  const [selectedItem, setSelectedItem] =
    useState<ProductSupplySearchItem | null>(null)
  const { currentRow } = useAdjustments()
  const isEdit = !!currentRow && open

  const form = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
    values: isEdit
      ? {
          itemType: currentRow.itemType,
          itemId: currentRow.productId || currentRow.supplyId || '',
          quantity: currentRow.quantity,
          reason: currentRow.reason,
        }
      : undefined,
    defaultValues: {
      itemType: 'product',
      itemId: '',
      quantity: 1,
      reason: '',
    },
  })

  const itemType = useWatch({ control: form.control, name: 'itemType' })
  const itemId = useWatch({ control: form.control, name: 'itemId' })
  const quantity = useWatch({ control: form.control, name: 'quantity' })

  const currentStock = selectedItem?.stock ?? 0
  const nextStock = currentStock + (Number.isFinite(quantity) ? quantity : 0)

  async function onSubmit(values: AdjustmentForm) {
    await run({
      mutation: async () => {
        if (isEdit) {
          await api.patch(`/stock/adjustments/${currentRow.id}`, values)
        } else {
          await api.post('/stock/adjustments', values)
        }
      },
      invalidate: [queryKeys.stock.adjustments],
      successMessage: isEdit
        ? 'Acerto atualizado com sucesso.'
        : 'Acerto criado com sucesso.',
      onSuccess: () => {
        form.reset()
        setSelectedItem(null)
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
          setSelectedItem(null)
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Editar Acerto' : 'Novo Acerto'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do acerto pendente.'
              : 'Registre um novo acerto de estoque. O ajuste ficará pendente até ser concluído.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='adjustment-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='itemType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de item</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: 'product' | 'supply') => {
                      field.onChange(value)
                      form.setValue('itemId', '')
                      setSelectedItem(null)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='product'>Produto</SelectItem>
                      <SelectItem value='supply'>Insumo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='itemId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <FormControl>
                    <ProductSupplyCombobox
                      type={itemType}
                      value={field.value}
                      onValueChange={field.onChange}
                      onItemChange={setSelectedItem}
                      selectedItem={selectedItem?.id === itemId ? selectedItem : null}
                      status='all'
                      includeStock
                      placeholder='Selecione o item'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='quantity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade do acerto</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='1'
                      autoComplete='off'
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          Number.isNaN(event.target.valueAsNumber)
                            ? 0
                            : event.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm sm:grid-cols-3'>
              <div>
                <Label className='text-muted-foreground'>Estoque atual</Label>
                <p className='font-medium'>
                  {currentStock} {selectedItem?.unit || ''}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Após acerto</Label>
                <p className='font-medium'>
                  {nextStock} {selectedItem?.unit || ''}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground'>Movimento</Label>
                <p className={quantity >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                  {quantity > 0 ? '+' : ''}{quantity || 0}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Informe o motivo do acerto...'
                      className='min-h-24'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='adjustment-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
