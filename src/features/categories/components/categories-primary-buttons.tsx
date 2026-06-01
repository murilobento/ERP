import { PlusCircledIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { useCategories } from './categories-provider'

export function CategoriesPrimaryButtons() {
  const { setOpen } = useCategories()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Adicionar Categoria</span> <PlusCircledIcon className='h-4 w-4' />
      </Button>
    </div>
  )
}
