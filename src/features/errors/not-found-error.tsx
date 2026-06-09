import { DefaultErrorActions, ErrorPage } from '@/components/error-page'

export function NotFoundError() {
  return (
    <ErrorPage
      code='404'
      title='Ops! Página Não Encontrada!'
      description={
        <>
          Parece que a página que você está procurando <br />
          não existe ou pode ter sido removida.
        </>
      }
      actions={<DefaultErrorActions />}
    />
  )
}
