import { Button } from '@/components/ui/button'
import { ErrorPage } from '@/components/error-page'

export function MaintenanceError() {
  return (
    <ErrorPage
      code='503'
      title='O site está em manutenção!'
      description={
        <>
          O site não está disponível no momento. <br />
          Voltaremos em breve.
        </>
      }
      actions={
        <div className='mt-6 flex gap-4'>
          <Button variant='outline'>Saiba mais</Button>
        </div>
      }
    />
  )
}
