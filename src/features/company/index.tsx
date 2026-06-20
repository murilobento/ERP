import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useCepLookup } from '@/hooks/use-cep-lookup'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { queryKeys } from '@/lib/query-keys'
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
  const { run, isLoading: isSaving } = useEntityMutation()
  const queryClient = useQueryClient()

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: emptyCompanyValues,
  })

  const { fetchCep, isLoadingCep } = useCepLookup(form)

  const { data: company, isLoading } = useQuery({
    queryKey: queryKeys.company,
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

  async function onSubmit(values: CompanyForm) {
    await run({
      mutation: async () => {
        const res = await api.put<{ company: Company }>('/company', values)
        queryClient.setQueryData(queryKeys.company, res.data.company)
        form.reset(toCompanyFormValues(res.data.company))
      },
      successMessage: 'Empresa salva com sucesso.',
    })
  }

  return (
    <>
      <PageHeader />

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
