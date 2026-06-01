import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSales } from './sales-provider'

export function SalesPrimaryButtons() {
  const { setOpen } = useSales()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Nova Venda</span> <ShoppingCart size={18} />
      </Button>
    </div>
  )
}
