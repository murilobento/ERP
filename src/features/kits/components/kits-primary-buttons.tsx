import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useKits } from './kits-provider'

export function KitsPrimaryButtons() {
  const { setOpen } = useKits()

  return (
    <Button onClick={() => setOpen('add')}>
      <Plus size={16} />
      Novo Kit
    </Button>
  )
}
