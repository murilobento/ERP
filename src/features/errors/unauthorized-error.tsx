import { DefaultErrorActions, ErrorPage } from '@/components/error-page'

export function UnauthorisedError() {
  return (
    <ErrorPage
      code='401'
      title='Acesso Não Autorizado'
      description={
        <>
          Por favor, faça login com as credenciais apropriadas <br /> para acessar
          este recurso.
        </>
      }
      actions={<DefaultErrorActions />}
    />
  )
}
