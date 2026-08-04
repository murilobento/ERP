import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ContactConfig } from './contact-types'

type ContactPrimaryButtonsProps = {
  config: ContactConfig
  onAdd: () => void
}

export function ContactPrimaryButtons({
  config,
  onAdd,
}: ContactPrimaryButtonsProps) {
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={onAdd}>
        <span>Adicionar {config.entityLabel}</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
