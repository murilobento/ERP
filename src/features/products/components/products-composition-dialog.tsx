import { useState, useCallback } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
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
import { type Product, type CompositionItem } from '../data/schema'

type CompositionForm = {
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
  const [items, setItems] = useState<CompositionForm[]>(
    () => currentRow.composition.map((c) => ({
      supplyId: c.supplyId,
      quantity: c.quantity,
    }))
  )
  const [supplyCache, setSupplyCache] = useState<Record<string, CompositionItem['supply']>>(
    () => Object.fromEntries(currentRow.composition.map((c) => [c.supplyId, c.supply]))
  )
  const queryClient = useQueryClient()

  const updateSupplyCache = useCallback((item: ProductSupplySearchItem | null) => {
    if (!item) return
    setSupplyCache((prev) => ({
      ...prev,
      [item.id]: { id: item.id, name: item.name, unit: item.unit || 'un', costPrice: item.costPrice ?? 0 },
    }))
  }, [])

  function addItem() {
    setItems([...items, { supplyId: '', quantity: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof CompositionForm, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const totalCost = items.reduce((sum, item) => {
    const supply = supplyCache[item.supplyId]
    if (!supply) return sum
    return sum + item.quantity * supply.costPrice
  }, 0)

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
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>Composição do Produto</DialogTitle>
          <DialogDescription>
            Defina os insumos e quantidades para produzir 1 unidade de{' '}
            <strong>{currentRow.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[400px] space-y-3 overflow-y-auto py-1'>
          {items.map((item, index) => {
            const supply = supplyCache[item.supplyId]
            const itemCost = supply ? item.quantity * supply.costPrice : 0

            return (
              <div key={index} className='flex items-end gap-2'>
                <div className='flex-1'>
                  <Label className='text-xs text-muted-foreground'>Insumo</Label>
                  <ProductSupplyCombobox
                    type='supply'
                    value={item.supplyId}
                    onValueChange={(val) => updateItem(index, 'supplyId', val)}
                    onItemChange={updateSupplyCache}
                    selectedItem={
                      currentRow.composition.find((c) => c.supplyId === item.supplyId)
                        ?.supply ?? (supply ? { id: supply.id, name: supply.name, unit: supply.unit, status: 'active' } : undefined)
                    }
                    status='all'
                    placeholder='Selecione...'
                  />
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
                <div className='w-28 pb-0.5'>
                  <Label className='text-xs text-muted-foreground'>Custo</Label>
                  <div className='flex h-9 items-center text-sm text-muted-foreground'>
                    {supply && itemCost > 0 ? `R$ ${itemCost.toFixed(2)}` : '—'}
                  </div>
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
            )
          })}

          <Button variant='outline' size='sm' onClick={addItem} className='w-full'>
            <Plus size={16} className='me-1' /> Adicionar Insumo
          </Button>
        </div>

        {totalCost > 0 && (
          <div className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
            <span className='font-medium'>Custo total por unidade</span>
            <span className='font-semibold'>R$ {totalCost.toFixed(2)}/{currentRow.unit}</span>
          </div>
        )}

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
