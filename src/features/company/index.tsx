import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useDocumentTitle } from '@/hooks/use-document-title'
import api from '@/lib/api'
import {
  CompanyAddressForm,
  CompanyBasicDataForm,
  CompanyLogoPreview,
  CompanySocialLinksForm,
} from './components/company-form-sections'
import {
  type CompanyForm,
  companyFormSchema,
  emptyCompanyValues,
  toCompanyFormValues,
} from './data/form'
import { type Company } from './data/schema'

type CompanyResponse = {
  company: Company | null
}

export function Company() {
  useDocumentTitle('Empresa')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: emptyCompanyValues,
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
      form.reset(toCompanyFormValues(company))
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
      form.reset(toCompanyFormValues(res.data.company))
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
          <Button
            type='submit'
            form='company-form'
            disabled={isSaving || isLoading}
          >
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
              <CompanyBasicDataForm form={form} />
              <CompanyAddressForm
                form={form}
                isLoadingCep={isLoadingCep}
                onFetchCep={fetchCep}
              />
              <CompanySocialLinksForm form={form} />
            </div>

            <CompanyLogoPreview logoUrl={logoUrl} />
          </form>
        </Form>
      </Main>
    </>
  )
}
