import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { type Category } from '../data/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  status: z.string().min(1, 'Status é obrigatório.'),
})

type CategoryForm = z.infer<typeof formSchema>

type CategoryActionDialogProps = {
  currentRow?: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoriesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: CategoryActionDialogProps) {
  const isEdit = !!currentRow
  const { run, isLoading } = useEntityMutation()

  const form = useForm<CategoryForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          status: currentRow.status,
        }
      : {
          name: '',
          status: 'active',
        },
  })

  async function onSubmit(values: CategoryForm) {
    await run({
      mutation: async () => {
        if (isEdit) {
          await api.patch(`/categories/${currentRow.id}`, values)
        } else {
          await api.post('/categories', values)
        }
      },
      invalidate: [queryKeys.categories],
      successMessage: isEdit
        ? 'Categoria atualizada com sucesso.'
        : 'Categoria criada com sucesso.',
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  const statusValue = useWatch({ control: form.control, name: 'status' })

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
              {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
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
              ? 'Atualize a categoria aqui. '
              : 'Crie uma nova categoria aqui. '}
            Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='category-form'
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
                      placeholder='Bolos'
                      className='col-span-4'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='category-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
