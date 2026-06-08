import { useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

const COMPANY_FALLBACK = 'Bendito Doce'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  useEffect(() => {
    document.title = `${COMPANY_FALLBACK} - Entrar`
  }, [])

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Entrar</CardTitle>
          <CardDescription>
            Insira seu e-mail e senha abaixo para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
