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
import { type Supply } from '../../supplies/data/schema'
import { usePurchases } from './purchases-provider'

type ItemForm = {
  supplyId: string
  packages: number
}

type PurchasesActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchasesActionDialog({
  open,
  onOpenChange,
}: PurchasesActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ supplyId: '', packages: 1 }])
  const queryClient = useQueryClient()
  const { currentRow } = usePurchases()

  const isEdit = !!currentRow && open

  const { data: suppliesData } = useQuery({
    queryKey: ['supplies'],
    queryFn: async () => {
      const res = await api.get('/supplies')
      return res.data.supplies as Supply[]
    },
  })

  const supplies = (suppliesData || []).filter((s) => s.status === 'active')
  const supplyMap = new Map(supplies.map((s) => [s.id, s]))

  function initWithCurrentRow() {
    if (currentRow && isEdit) {
      setSupplier(currentRow.supplier)
      setNotes(currentRow.notes)
      setItems(
        currentRow.items.map((i) => ({
          supplyId: i.supplyId,
          packages: i.packages,
        }))
      )
    } else {
      setSupplier('')
      setNotes('')
      setItems([{ supplyId: '', packages: 1 }])
    }
  }

  function handleOpenChange(state: boolean) {
    if (state) initWithCurrentRow()
    onOpenChange(state)
  }

  function addItem() {
    setItems([...items, { supplyId: '', packages: 1 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ItemForm, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  async function onSubmit() {
    if (!supplier.trim()) {
      toast.error('Fornecedor é obrigatório.')
      return
    }
    const validItems = items.filter((i) => i.supplyId && i.packages > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        await api.patch(`/purchases/${currentRow.id}`, {
          supplier,
          notes,
          items: validItems,
        })
        toast.success('Compra atualizada com sucesso.')
      } else {
        await api.post('/purchases', {
          supplier,
          notes,
          items: validItems,
        })
        toast.success('Compra criada com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da compra.' : 'Registre uma nova compra de insumos.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
            <Label className='col-span-2 text-end'>Fornecedor</Label>
            <Input
              className='col-span-4'
              placeholder='Nome do fornecedor'
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              autoComplete='off'
            />
          </div>

          <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
            <Label className='col-span-2 text-end'>Observação</Label>
            <Input
              className='col-span-4'
              placeholder='Opcional'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoComplete='off'
            />
          </div>

          <div>
            <Label className='mb-2 block text-sm font-medium'>Itens</Label>
            <div className='max-h-[300px] space-y-2 overflow-y-auto'>
              {items.map((item, index) => {
                const supply = supplyMap.get(item.supplyId)
                const total = supply ? item.packages * supply.packageQuantity : 0
                return (
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
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='w-24'>
                      <Label className='text-xs text-muted-foreground'>Embala­gens</Label>
                      <Input
                        type='number'
                        min='1'
                        step='1'
                        value={item.packages || ''}
                        onChange={(e) =>
                          updateItem(index, 'packages', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    {supply && (
                      <span className='shrink-0 pb-1 text-xs text-muted-foreground'>
                        = {total} {supply.unit}
                      </span>
                    )}
                    {items.length > 1 && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='shrink-0 text-red-500'
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            <Button variant='outline' size='sm' onClick={addItem} className='mt-2 w-full'>
              <Plus size={16} className='me-1' /> Adicionar Item
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            {isEdit ? 'Salvar Alterações' : 'Criar Compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
