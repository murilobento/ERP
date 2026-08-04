import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Command } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

type PublicCompany = {
  name: string
  logoUrl: string
}

type PublicCompanyResponse = {
  company: PublicCompany | null
}

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | undefined>()
  const { data: company } = useQuery({
    queryKey: queryKeys.companyPublic,
    queryFn: async () => {
      const res = await api.get<PublicCompanyResponse>('/company/public')
      return res.data.company
    },
    staleTime: 1000 * 60 * 5,
  })

  const companyName = company?.name?.trim() || 'Bendito Doce'
  const logoUrl = company?.logoUrl?.trim()
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl

  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8'>
        <div className='mb-4 flex items-center justify-center'>
          {showLogo ? (
            <img
              src={logoUrl}
              alt={companyName}
              className='me-2 size-8 rounded-lg object-contain'
              onError={() => setFailedLogoUrl(logoUrl)}
            />
          ) : (
            <div className='me-2 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
              <Command className='size-4' />
            </div>
          )}
          <h1 className='text-xl font-medium'>{companyName}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
