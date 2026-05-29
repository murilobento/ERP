import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Product } from '../data/schema'
import { type Supply } from '../../supplies/data/schema'

type CompositionItem = {
  supplyId: string
  quantity: number
}

type ProductCompositionDialogProps = {
  currentRow: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsCompositionDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductCompositionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<CompositionItem[]>(
    () => currentRow.composition.map((c) => ({
      supplyId: c.supplyId,
      quantity: c.quantity,
    }))
  )
  const queryClient = useQueryClient()

  const { data: suppliesData } = useQuery({
    queryKey: ['supplies'],
    queryFn: async () => {
      const res = await api.get('/supplies')
      return res.data.supplies as Supply[]
    },
  })

  const supplies = suppliesData || []

  function addItem() {
    setItems([...items, { supplyId: '', quantity: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof CompositionItem, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  async function onSubmit() {
    const validItems = items.filter((i) => i.supplyId && i.quantity > 0)
    setIsLoading(true)
    try {
      await api.put(`/products/${currentRow.id}/composition`, { items: validItems })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Composição atualizada com sucesso.')
      onOpenChange(false)
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Composição do Produto</DialogTitle>
          <DialogDescription>
            Defina os insumos e quantidades para produzir 1 unidade de{' '}
            <strong>{currentRow.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[400px] space-y-3 overflow-y-auto py-1'>
          {items.map((item, index) => (
            <div key={index} className='flex items-end gap-2'>
              <div className='flex-1'>
                <Label className='text-xs text-muted-foreground'>Insumo</Label>
                <Select
                  value={item.supplyId}
                  onValueChange={(val) => updateItem(index, 'supplyId', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecione...' />
                  </SelectTrigger>
                  <SelectContent>
                    {supplies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='w-24'>
                <Label className='text-xs text-muted-foreground'>Qtd</Label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  value={item.quantity || ''}
                  onChange={(e) =>
                    updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='shrink-0 text-red-500'
                onClick={() => removeItem(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          <Button variant='outline' size='sm' onClick={addItem} className='w-full'>
            <Plus size={16} className='me-1' /> Adicionar Insumo
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Salvar Composição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
