import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient, useQuery } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Product } from '../../products/data/schema'

const formSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório.'),
  quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero.'),
  notes: z.string(),
})

type ProductionForm = z.infer<typeof formSchema>

type ProductionsActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductionsActionDialog({
  open,
  onOpenChange,
}: ProductionsActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data.products as Product[]
    },
  })

  const products = (productsData || []).filter((p) => p.status === 'active')

  const form = useForm<ProductionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      quantity: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  async function onSubmit(values: ProductionForm) {
    setIsLoading(true)
    try {
      await api.post('/productions', values)
      queryClient.invalidateQueries({ queryKey: ['productions'] })
      toast.success('Produção criada com sucesso.')
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
          <DialogTitle>Nova Produção</DialogTitle>
          <DialogDescription>
            Crie uma nova ordem de produção. Ela será criada como rascunho.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='production-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 px-0.5'
          >
            <FormField
              control={form.control}
              name='productId'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Produto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='col-span-4'>
                        <SelectValue placeholder='Selecione o produto' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.unit})
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
              name='quantity'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Quantidade</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' min='0' className='col-span-4' autoComplete='off' value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Observação</FormLabel>
                  <FormControl>
                    <Input placeholder='Opcional' className='col-span-4' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='production-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Criar Produção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
