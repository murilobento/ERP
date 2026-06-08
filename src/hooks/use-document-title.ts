import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { type Company } from '@/features/company/data/schema'

type CompanyResponse = {
  company: Company | null
}

const COMPANY_FALLBACK = 'Bendito Doce'

export function useDocumentTitle(pageTitle: string) {
  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await api.get<CompanyResponse>('/company')
      return res.data.company
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    const companyName = company?.name?.trim() || COMPANY_FALLBACK
    document.title = `${companyName} - ${pageTitle}`
  }, [company?.name, pageTitle])
}
