import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { useQueryClient } from '@tanstack/react-query'
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
import { type Supply } from '../data/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  unit: z.string().min(1, 'Unidade base é obrigatória.'),
  packageUnit: z.string(),
  packageQuantity: z.number().min(0.01, 'Qtd por embalagem deve ser maior que zero.'),
  status: z.string().min(1, 'Status é obrigatório.'),
})

type SupplyForm = z.infer<typeof formSchema>

type SupplyActionDialogProps = {
  currentRow?: Supply
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuppliesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: SupplyActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<SupplyForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          unit: currentRow.unit,
          packageUnit: currentRow.packageUnit,
          packageQuantity: currentRow.packageQuantity,
          status: currentRow.status,
        }
      : {
          name: '',
          unit: 'un',
          packageUnit: '',
          packageQuantity: 1,
          status: 'active',
        },
  })

  async function onSubmit(values: SupplyForm) {
    setIsLoading(true)
    try {
      if (isEdit) {
        await api.patch(`/supplies/${currentRow.id}`, values)
        toast.success('Insumo atualizado com sucesso.')
      } else {
        await api.post('/supplies', values)
        toast.success('Insumo criado com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const [statusValue, unit, packageQuantity] = useWatch({
    control: form.control,
    name: ['status', 'unit', 'packageQuantity'],
  })

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
            <DialogTitle>{isEdit ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle>
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
            {isEdit ? 'Atualize o insumo aqui. ' : 'Crie um novo insumo aqui. '}
            Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='supply-form'
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
                    <Input placeholder='Farinha de trigo' className='col-span-4' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='unit'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Unidade base</FormLabel>
                  <FormControl>
                    <Input placeholder='g, ml, un, m...' className='col-span-4' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='packageUnit'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Embalagem</FormLabel>
                  <FormControl>
                    <Input placeholder='1kg, 1L, dúzia (12 un)...' className='col-span-4' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='packageQuantity'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Qtd por embalagem</FormLabel>
                  <div className='col-span-4 flex items-center gap-2'>
                    <FormControl>
                      <Input type='number' step='0.01' min='0.01' autoComplete='off' value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
                    </FormControl>
                    <span className='shrink-0 text-sm text-muted-foreground'>{unit || 'un'}</span>
                  </div>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            {packageQuantity > 0 && (
              <div className='col-span-6 rounded-md border bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground'>
                1 embalagem = {packageQuantity} {unit || 'un'}
              </div>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='supply-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
