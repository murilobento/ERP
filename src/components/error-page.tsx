import { useNavigate, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type ErrorPageProps = {
  code: string
  title: string
  description: ReactNode
  actions?: ReactNode
}

export function DefaultErrorActions() {
  const navigate = useNavigate()
  const { history } = useRouter()

  return (
    <div className='mt-6 flex gap-4'>
      <Button variant='outline' onClick={() => history.go(-1)}>
        Voltar
      </Button>
      <Button onClick={() => navigate({ to: '/' })}>Voltar ao Início</Button>
    </div>
  )
}

export function ErrorPage({ code, title, description, actions }: ErrorPageProps) {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>{code}</h1>
        <span className='font-medium'>{title}</span>
        <p className='text-center text-muted-foreground'>{description}</p>
        {actions}
      </div>
    </div>
  )
}
