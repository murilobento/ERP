import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin } from 'lucide-react'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import api from '@/lib/api'
import { formatPhone, formatZipCode } from '@/lib/formatters'
import { useCepLookup } from '@/hooks/use-cep-lookup'
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
import { type Contact, type ContactConfig } from './contact-types'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  phone: z.string().min(1, 'Telefone é obrigatório.'),
  zipCode: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  status: z.string().min(1, 'Status é obrigatório.'),
})

type ContactForm = z.infer<typeof formSchema>

type ContactActionDialogProps = {
  config: ContactConfig
  currentRow?: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactActionDialog({
  config,
  currentRow,
  open,
  onOpenChange,
}: ContactActionDialogProps) {
  const isEdit = !!currentRow
  const { run, isLoading } = useEntityMutation()

  const form = useForm<ContactForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          phone: currentRow.phone,
          zipCode: currentRow.zipCode,
          street: currentRow.street,
          number: currentRow.number,
          complement: currentRow.complement,
          neighborhood: currentRow.neighborhood,
          city: currentRow.city,
          state: currentRow.state,
          status: currentRow.status,
        }
      : {
          name: '',
          phone: '',
          zipCode: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          status: 'active',
        },
  })

  const { fetchCep, isLoadingCep } = useCepLookup(form)

  async function onSubmit(values: ContactForm) {
    await run({
      mutation: async () => {
        if (isEdit) {
          await api.patch(`/${config.endpoint}/${currentRow.id}`, values)
        } else {
          await api.post(`/${config.endpoint}`, values)
        }
      },
      invalidate: [config.queryKey],
      successMessage: isEdit
        ? `${config.entityLabel} atualizado com sucesso.`
        : `${config.entityLabel} criado com sucesso.`,
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
            <DialogTitle>{isEdit ? `Editar ${config.entityLabel}` : `Novo ${config.entityLabel}`}</DialogTitle>
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
            {isEdit ? `Atualize o ${config.entityLabelLower} aqui. ` : `Crie um novo ${config.entityLabelLower} aqui. `}
            Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className='h-[500px] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id={config.formId}
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
                        placeholder={config.namePlaceholder}
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
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='(11) 99999-9999'
                        className='col-span-4'
                        autoComplete='off'
                        value={field.value}
                        onChange={(e) => {
                          const masked = formatPhone(e.target.value)
                          field.onChange(masked)
                        }}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='zipCode'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>CEP</FormLabel>
                    <div className='col-span-4 flex items-center gap-2'>
                      <FormControl>
                        <Input
                          placeholder='00000-000'
                          autoComplete='off'
                          value={field.value}
                          onChange={(e) => {
                            const masked = formatZipCode(e.target.value)
                            field.onChange(masked)
                          }}
                          onBlur={() => {
                            if (field.value) fetchCep(field.value)
                          }}
                        />
                      </FormControl>
                      {isLoadingCep && (
                        <Loader2 className='size-4 animate-spin text-muted-foreground' />
                      )}
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8 shrink-0'
                        disabled={isLoadingCep}
                        onClick={() => {
                          if (field.value) fetchCep(field.value)
                        }}
                      >
                        <MapPin className='size-4' />
                      </Button>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='street'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Rua</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Rua Exemplo'
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
                name='number'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Número</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='123'
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
                name='complement'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Complemento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Apto 4B'
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
                name='neighborhood'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Bairro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Centro'
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
                name='city'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Cidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='São Paulo'
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
                name='state'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Estado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='SP'
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
        </div>
        <DialogFooter>
          <Button type='submit' form={config.formId} disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
