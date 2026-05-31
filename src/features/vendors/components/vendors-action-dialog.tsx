import { useState, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
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
import { type Vendor } from '../data/schema'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

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

type VendorForm = z.infer<typeof formSchema>

type VendorActionDialogProps = {
  currentRow?: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VendorsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: VendorActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<VendorForm>({
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

  const fetchCep = useCallback(
    async (rawCep: string) => {
      const cep = rawCep.replace(/\D/g, '')
      if (cep.length !== 8) return

      setIsLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()

        if (data.erro) {
          toast.error('CEP não encontrado.')
          return
        }

        form.setValue('street', data.logradouro || '')
        form.setValue('neighborhood', data.bairro || '')
        form.setValue('city', data.localidade || '')
        form.setValue('state', data.uf || '')
      } catch {
        toast.error('Erro ao buscar CEP.')
      } finally {
        setIsLoadingCep(false)
      }
    },
    [form]
  )

  async function onSubmit(values: VendorForm) {
    setIsLoading(true)
    try {
      if (isEdit) {
        await api.patch(`/vendors/${currentRow.id}`, values)
        toast.success('Fornecedor atualizado com sucesso.')
      } else {
        await api.post('/vendors', values)
        toast.success('Fornecedor criado com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
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
            <DialogTitle>{isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
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
            {isEdit ? 'Atualize o fornecedor aqui. ' : 'Crie um novo fornecedor aqui. '}
            Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className='h-[500px] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='vendor-form'
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
                        placeholder='Fornecedor Exemplo'
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
          <Button type='submit' form='vendor-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
