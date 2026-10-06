import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'
import {
  computeMarginFromSalePrice,
  computeProductCost,
  computeSalePriceFromMargin,
} from '@/lib/pricing'
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
import { Switch } from '@/components/ui/switch'
import { type Product } from '../data/schema'

type CategoryOption = {
  id: string
  name: string
}

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  margin: z
    .number()
    .min(0, 'Margem deve ser >= 0.')
    .refine((m) => m < 100, 'Margem deve ser < 100%.'),
  freightCost: z.number().min(0, 'Frete deve ser >= 0.'),
  packagingCost: z.number().min(0, 'Embalagem deve ser >= 0.'),
  status: z.string().min(1, 'Status é obrigatório.'),
  categoryId: z.string().min(1, 'Categoria é obrigatória.'),
})

type ProductForm = z.infer<typeof formSchema>

type ProductActionDialogProps = {
  currentRow?: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductActionDialogProps) {
  const isEdit = !!currentRow
  const { run, isLoading } = useEntityMutation()
  const [localSalePrice, setLocalSalePrice] = useState<string | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const res = await api.get('/categories')
      return res.data.categories as CategoryOption[]
    },
  })

  const form = useForm<ProductForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          margin: currentRow.margin,
          freightCost: currentRow.freightCost ?? 0,
          packagingCost: currentRow.packagingCost ?? 0,
          status: currentRow.status,
          categoryId: currentRow.categoryId,
        }
      : {
          name: '',
          margin: 0,
          freightCost: 0,
          packagingCost: 0,
          status: 'active',
          categoryId: '',
        },
  })

  async function onSubmit(values: ProductForm) {
    await run({
      mutation: async () => {
        if (isEdit) {
          await api.patch(`/products/${currentRow.id}`, values)
        } else {
          await api.post('/products', values)
        }
      },
      invalidate: [queryKeys.products],
      successMessage: isEdit
        ? 'Produto atualizado com sucesso.'
        : 'Produto criado com sucesso.',
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  const statusValue = useWatch({ control: form.control, name: 'status' })
  const marginValue = useWatch({ control: form.control, name: 'margin' })
  const freightValue = useWatch({ control: form.control, name: 'freightCost' })
  const packagingValue = useWatch({
    control: form.control,
    name: 'packagingCost',
  })

  const compositionCost = isEdit
    ? computeProductCost({
        margin: 0,
        composition: currentRow.composition.map((item) => ({
          quantity: item.quantity,
          supply: { costPrice: item.supply.costPrice },
        })),
      })
    : 0
  const totalCost =
    compositionCost + (freightValue ?? 0) + (packagingValue ?? 0)
  const salePrice = computeSalePriceFromMargin(totalCost, marginValue ?? 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>
              {isEdit ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <div className='flex items-center gap-2'>
              <Switch
                checked={statusValue === 'active'}
                onCheckedChange={(checked) =>
                  form.setValue('status', checked ? 'active' : 'inactive')
                }
              />
              <Label className='text-sm text-muted-foreground'>
                {statusValue === 'active' ? 'Ativo' : 'Inativo'}
              </Label>
            </div>
          </div>
          <DialogDescription>
            {isEdit
              ? 'Atualize o produto aqui. '
              : 'Crie um novo produto aqui. '}
            Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='product-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 px-0.5'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Bolo de Chocolate'
                      className='col-span-4'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Categoria
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='col-span-4'>
                        <SelectValue placeholder='Selecione uma categoria' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='margin'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Margem (%)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      className='col-span-4'
                      autoComplete='off'
                      value={field.value || ''}
                      onChange={(e) => {
                        setLocalSalePrice(null)
                        field.onChange(parseFloat(e.target.value) || 0)
                      }}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            {isEdit && (
              <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
                <FormField
                  control={form.control}
                  name='freightCost'
                  render={({ field }) => (
                    <FormItem className='col-span-3 space-y-1'>
                      <FormLabel>Frete (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          autoComplete='off'
                          value={field.value ?? ''}
                          onChange={(e) => {
                            setLocalSalePrice(null)
                            field.onChange(parseFloat(e.target.value) || 0)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='packagingCost'
                  render={({ field }) => (
                    <FormItem className='col-span-3 space-y-1'>
                      <FormLabel>Embalagem (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          autoComplete='off'
                          value={field.value ?? ''}
                          onChange={(e) => {
                            setLocalSalePrice(null)
                            field.onChange(parseFloat(e.target.value) || 0)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {isEdit && (
              <div className='grid gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm sm:grid-cols-3'>
                <div>
                  <Label className='text-muted-foreground'>Custo total</Label>
                  <p className='font-medium'>
                    {totalCost > 0 ? `R$ ${totalCost.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground'>Margem</Label>
                  <p className='font-medium'>{marginValue ?? 0}%</p>
                </div>
                <div>
                  <Label className='text-muted-foreground'>
                    Preço de venda
                  </Label>
                  {totalCost > 0 && marginValue < 100 ? (
                    <div className='flex items-center gap-1'>
                      <span className='text-sm text-muted-foreground'>R$</span>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        className='h-7 font-medium'
                        autoComplete='off'
                        value={
                          localSalePrice ??
                          (Number.isFinite(salePrice)
                            ? salePrice.toFixed(2)
                            : '')
                        }
                        onChange={(e) => {
                          setLocalSalePrice(e.target.value)
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0) {
                            form.setValue(
                              'margin',
                              computeMarginFromSalePrice(totalCost, val)
                            )
                          }
                        }}
                        onBlur={() => setLocalSalePrice(null)}
                      />
                    </div>
                  ) : (
                    <p className='font-medium'>—</p>
                  )}
                </div>
              </div>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='product-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
