import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupplies } from './supplies-provider'

export function SuppliesPrimaryButtons() {
  const { setOpen } = useSupplies()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Adicionar Insumo</span> <PackagePlus size={18} />
      </Button>
    </div>
  )
}
