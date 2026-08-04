import { cn } from '@/lib/utils'
import { DefaultErrorActions, ErrorPage } from '@/components/error-page'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
}

export function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  if (minimal) {
    return (
      <div className={cn('h-svh w-full', className)}>
        <ErrorPage
          code='500'
          title='Ops! Algo deu errado :)'
          description={
            <>
              Pedimos desculpas pelo inconveniente. <br /> Por favor, tente
              novamente mais tarde.
            </>
          }
        />
      </div>
    )
  }

  return (
    <div className={cn('h-svh w-full', className)}>
      <ErrorPage
        code='500'
        title='Ops! Algo deu errado :)'
        description={
          <>
            Pedimos desculpas pelo inconveniente. <br /> Por favor, tente
            novamente mais tarde.
          </>
        }
        actions={<DefaultErrorActions />}
      />
    </div>
  )
}
