import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import {
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
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
import api from '@/lib/api'

const adjustmentSchema = z.object({
  itemType: z.enum(['product', 'supply']),
  itemId: z.string().min(1, 'Item é obrigatório.'),
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro.')
    .refine((value) => value !== 0, {
      message: 'Quantidade deve ser diferente de zero.',
    }),
  reason: z.string().min(1, 'Motivo é obrigatório.'),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

export function Stock() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] =
    useState<ProductSupplySearchItem | null>(null)
  const queryClient = useQueryClient()

  const form = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
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
    setIsLoading(true)
    try {
      await api.post('/stock/adjustments', values)
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Acerto de estoque registrado.')
      form.reset({
        itemType: values.itemType,
        itemId: '',
        quantity: 1,
        reason: '',
      })
      setSelectedItem(null)
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <FullscreenToggle />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Acerto de Estoque</h2>
          <p className='text-muted-foreground'>
            Registre ajustes manuais positivos ou negativos com motivo.
          </p>
        </div>

        <div className='w-full rounded-md border p-4'>
          <Form {...form}>
            <form
              id='stock-adjustment-form'
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

              <div className='flex justify-end'>
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <Save size={16} />}
                  Salvar Acerto
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Main>
    </>
  )
}
