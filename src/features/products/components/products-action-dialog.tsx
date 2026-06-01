import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Product } from '../data/schema'

type CategoryOption = {
  id: string
  name: string
}

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  unit: z.string().min(1, 'Unidade é obrigatória.'),
  margin: z.number().min(0, 'Margem deve ser >= 0.'),
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
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
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
          unit: currentRow.unit,
          margin: currentRow.margin,
          status: currentRow.status,
          categoryId: currentRow.categoryId,
        }
      : {
          name: '',
          unit: 'un',
          margin: 0,
          status: 'active',
          categoryId: '',
        },
  })

  async function onSubmit(values: ProductForm) {
    setIsLoading(true)
    try {
      if (isEdit) {
        await api.patch(`/products/${currentRow.id}`, values)
        toast.success('Produto atualizado com sucesso.')
      } else {
        await api.post('/products', values)
        toast.success('Produto criado com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const statusValue = form.watch('status')

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
            <DialogTitle>{isEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
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
            {isEdit ? 'Atualize o produto aqui. ' : 'Crie um novo produto aqui. '}
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
                    <Input placeholder='Bolo de Chocolate' className='col-span-4' autoComplete='off' {...field} />
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
                  <FormLabel className='col-span-2 text-end'>Categoria</FormLabel>
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
              name='unit'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Unidade</FormLabel>
                  <FormControl>
                    <Input placeholder='un, kg, lt, m...' className='col-span-4' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='margin'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Margem (%)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min='0'
                      step='1'
                      className='col-span-4'
                      autoComplete='off'
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
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
