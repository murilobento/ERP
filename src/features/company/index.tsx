import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ImageIcon, Loader2, MapPin, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import { type Company } from './data/schema'

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || z.url().safeParse(value).success, {
    message: 'Informe uma URL válida.',
  })

const formSchema = z.object({
  name: z.string().trim().min(1, 'Nome da empresa é obrigatório.'),
  tradeName: z.string(),
  cnpj: z.string(),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: 'Informe um e-mail válido.',
    }),
  phone: z.string(),
  logoUrl: optionalUrl,
  zipCode: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  website: optionalUrl,
  instagram: z.string(),
  facebook: z.string(),
  linkedin: z.string(),
  whatsapp: z.string(),
})

type CompanyForm = z.infer<typeof formSchema>

type CompanyResponse = {
  company: Company | null
}

const emptyValues: CompanyForm = {
  name: '',
  tradeName: '',
  cnpj: '',
  email: '',
  phone: '',
  logoUrl: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  website: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  whatsapp: '',
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

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

function toFormValues(company: Company | null): CompanyForm {
  if (!company) return emptyValues

  return {
    name: company.name,
    tradeName: company.tradeName,
    cnpj: company.cnpj,
    email: company.email,
    phone: company.phone,
    logoUrl: company.logoUrl,
    zipCode: company.zipCode,
    street: company.street,
    number: company.number,
    complement: company.complement,
    neighborhood: company.neighborhood,
    city: company.city,
    state: company.state,
    website: company.website,
    instagram: company.instagram,
    facebook: company.facebook,
    linkedin: company.linkedin,
    whatsapp: company.whatsapp,
  }
}

export function Company() {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<CompanyForm>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  })

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await api.get<CompanyResponse>('/company')
      return res.data.company
    },
  })

  useEffect(() => {
    if (company !== undefined) {
      form.reset(toFormValues(company))
    }
  }, [company, form])

  const logoUrl = useWatch({ control: form.control, name: 'logoUrl' })

  async function fetchCep(rawCep: string) {
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
  }

  async function onSubmit(values: CompanyForm) {
    setIsSaving(true)
    try {
      const res = await api.put<{ company: Company }>('/company', values)
      queryClient.setQueryData(['company'], res.data.company)
      form.reset(toFormValues(res.data.company))
      toast.success('Empresa salva com sucesso.')
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsSaving(false)
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
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Empresa</h2>
            <p className='text-muted-foreground'>
              Configure os dados da empresa que utiliza o app.
            </p>
          </div>
          <Button type='submit' form='company-form' disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className='animate-spin' /> : <Save />}
            Salvar
          </Button>
        </div>

        <Form {...form}>
          <form
            id='company-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'
          >
            <div className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Dados básicos</CardTitle>
                  <CardDescription>
                    Informações principais para identificar a empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da empresa</FormLabel>
                        <FormControl>
                          <Input placeholder='Empresa Exemplo Ltda' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='tradeName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome fantasia</FormLabel>
                        <FormControl>
                          <Input placeholder='Empresa Exemplo' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='cnpj'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='00.000.000/0000-00'
                            autoComplete='off'
                            value={field.value}
                            onChange={(event) => field.onChange(formatCnpj(event.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Opcional.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder='contato@empresa.com' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='(11) 99999-9999'
                            autoComplete='off'
                            value={field.value}
                            onChange={(event) => field.onChange(formatPhone(event.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='logoUrl'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da logo</FormLabel>
                        <FormControl>
                          <Input placeholder='https://...' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                  <CardDescription>
                    Dados de localização da empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='zipCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <div className='flex items-center gap-2'>
                          <FormControl>
                            <Input
                              placeholder='00000-000'
                              autoComplete='off'
                              value={field.value}
                              onChange={(event) => field.onChange(formatZipCode(event.target.value))}
                              onBlur={() => {
                                if (field.value) fetchCep(field.value)
                              }}
                            />
                          </FormControl>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            className='shrink-0'
                            disabled={isLoadingCep}
                            onClick={() => {
                              if (field.value) fetchCep(field.value)
                            }}
                          >
                            {isLoadingCep ? (
                              <Loader2 className='animate-spin' />
                            ) : (
                              <MapPin />
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='street'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input placeholder='Rua Exemplo' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder='123' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='complement'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder='Sala 2' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='neighborhood'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder='Centro' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='grid gap-4 sm:grid-cols-[1fr_6rem]'>
                    <FormField
                      control={form.control}
                      name='city'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder='São Paulo' autoComplete='off' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='state'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input placeholder='SP' maxLength={2} autoComplete='off' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Redes sociais</CardTitle>
                  <CardDescription>
                    Canais digitais que podem ser usados em documentos futuros.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='website'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site</FormLabel>
                        <FormControl>
                          <Input placeholder='https://empresa.com' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='instagram'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder='@empresa' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='facebook'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder='facebook.com/empresa' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='linkedin'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder='linkedin.com/company/empresa' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='whatsapp'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='(11) 99999-9999'
                            autoComplete='off'
                            value={field.value}
                            onChange={(event) => field.onChange(formatPhone(event.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className='h-fit'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='size-5' />
                  Identidade
                </CardTitle>
                <CardDescription>
                  Prévia da logo informada por URL.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted/40'>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt='Logo da empresa'
                      className='max-h-full max-w-full object-contain p-4'
                    />
                  ) : (
                    <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                      <ImageIcon className='size-8' />
                      <span className='text-sm'>Sem logo</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </Main>
    </>
  )
}
