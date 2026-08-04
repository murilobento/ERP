import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { Badge } from '@/components/ui/badge'
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
import { PasswordInput } from '@/components/password-input'
import { type User } from '../data/schema'

const USER_ROLES = ['admin', 'manager', 'operator', 'viewer'] as const

const roleMap: Record<
  string,
  { label: string; variant: 'danger' | 'warning' | 'blue' | 'secondary' }
> = {
  admin: { label: 'Administrador', variant: 'danger' },
  manager: { label: 'Gerente', variant: 'warning' },
  operator: { label: 'Operador', variant: 'blue' },
  viewer: { label: 'Visualizador', variant: 'secondary' },
}

const formSchema = z
  .object({
    firstName: z.string().min(1, 'Nome é obrigatório.'),
    lastName: z.string().min(1, 'Sobrenome é obrigatório.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'E-mail é obrigatório.' : undefined),
    }),
    role: z.enum(USER_ROLES),
    password: z.string().transform((pwd) => pwd.trim()),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    { message: 'Senha é obrigatória.', path: ['password'] }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 7
    },
    { message: 'A senha deve ter pelo menos 7 caracteres.', path: ['password'] }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    { message: 'As senhas não coincidem.', path: ['confirmPassword'] }
  )

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const { run, isLoading } = useEntityMutation()
  const { auth } = useAuthStore()
  const isAdmin = auth.user?.role === 'admin'

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          role: (currentRow.role as UserForm['role']) ?? 'operator',
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          role: 'operator',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  })

  const isPasswordTouched = !!form.formState.dirtyFields.password

  async function onSubmit(values: UserForm) {
    await run({
      mutation: async () => {
        if (isEdit) {
          const payload: Record<string, string> = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
          }
          if (isAdmin) payload.role = values.role
          if (values.password) payload.password = values.password
          await api.patch(`/users/${currentRow.id}`, payload)
        } else {
          await api.post('/users', {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            role: isAdmin ? values.role : undefined,
          })
        }
      },
      invalidate: [queryKeys.users],
      successMessage: isEdit
        ? 'Usuário atualizado com sucesso.'
        : 'Usuário criado com sucesso.',
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
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
          <DialogTitle>
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize o usuário aqui. '
              : 'Crie um novo usuário aqui. '}
            Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className='h-80 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John'
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
                name='lastName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Sobrenome
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Doe'
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
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john.doe@gmail.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              {isAdmin && (
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => {
                    const roleInfo = roleMap[field.value]
                    return (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end'>
                          Função
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='col-span-4'>
                              <SelectValue>
                                {roleInfo && (
                                  <Badge
                                    variant={roleInfo.variant}
                                    className='text-xs'
                                  >
                                    {roleInfo.label}
                                  </Badge>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {USER_ROLES.map((r) => {
                              const info = roleMap[r]
                              return (
                                <SelectItem key={r} value={r}>
                                  <Badge
                                    variant={info?.variant}
                                    className='text-xs'
                                  >
                                    {info?.label ?? r}
                                  </Badge>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )
                  }}
                />
              )}
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Senha</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='e.g., S3cur3P@ssw0rd'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Confirmar Senha
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder='e.g., S3cur3P@ssw0rd'
                        className='col-span-4'
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
          <Button type='submit' form='user-form' disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
