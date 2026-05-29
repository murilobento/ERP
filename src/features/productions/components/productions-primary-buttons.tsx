import { Factory } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductions } from './productions-provider'

export function ProductionsPrimaryButtons() {
  const { setOpen } = useProductions()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Nova Produção</span> <Factory size={18} />
      </Button>
    </div>
  )
}
