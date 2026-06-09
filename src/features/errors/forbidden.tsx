import { DefaultErrorActions, ErrorPage } from '@/components/error-page'

export function ForbiddenError() {
  return (
    <ErrorPage
      code='403'
      title='Acesso Proibido'
      description={
        <>
          Você não tem permissão necessária <br />
          para visualizar este recurso.
        </>
      }
      actions={<DefaultErrorActions />}
    />
  )
}
