import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClients } from './clients-provider'

export function ClientsPrimaryButtons() {
  const { setOpen } = useClients()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Adicionar Cliente</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
