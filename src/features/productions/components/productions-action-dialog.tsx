import { useState } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ItemForm = {
  productId: string
  quantity: number
}

type ProductionsActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductionsActionDialog({
  open,
  onOpenChange,
}: ProductionsActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [draftItem, setDraftItem] = useState<ItemForm>({
    productId: '',
    quantity: 1,
  })
  const [items, setItems] = useState<ItemForm[]>([])
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, ProductSupplySearchItem>
  >({})
  const queryClient = useQueryClient()

  function resetForm() {
    setNotes('')
    setDraftItem({ productId: '', quantity: 1 })
    setItems([])
    setSelectedProducts({})
  }

  function updateSelectedProduct(item: ProductSupplySearchItem | null) {
    if (!item) return
    setSelectedProducts((current) => ({ ...current, [item.id]: item }))
  }

  function addItem() {
    if (!draftItem.productId || draftItem.quantity <= 0) {
      toast.error('Selecione um produto e informe uma quantidade válida.')
      return
    }
    if (items.some((item) => item.productId === draftItem.productId)) {
      toast.error('Este produto já foi adicionado.')
      return
    }

    setItems([...items, draftItem])
    setDraftItem({ productId: '', quantity: 1 })
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function onSubmit() {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/productions', { notes, items })
      queryClient.invalidateQueries({ queryKey: ['productions'] })
      toast.success('Produção criada com sucesso.')
      resetForm()
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
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) resetForm()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>Nova Produção</DialogTitle>
          <DialogDescription>
            Crie uma nova ordem de produção. Ela será criada como rascunho.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 px-0.5'>
          <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
            <Label className='col-span-2 text-end'>Observação</Label>
            <Input
              placeholder='Opcional'
              className='col-span-4'
              autoComplete='off'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label className='mb-2 block text-sm font-medium'>Itens</Label>
            <div className='grid grid-cols-[1fr_7rem_auto] items-end gap-2'>
              <div>
                <Label className='text-xs text-muted-foreground'>Produto</Label>
                <ProductSupplyCombobox
                  type='product'
                  value={draftItem.productId}
                  onValueChange={(value) =>
                    setDraftItem((current) => ({ ...current, productId: value }))
                  }
                  onItemChange={updateSelectedProduct}
                  selectedItem={selectedProducts[draftItem.productId]}
                  placeholder='Selecione o produto'
                />
              </div>
              <div>
                <Label className='text-xs text-muted-foreground'>Quantidade</Label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  autoComplete='off'
                  value={draftItem.quantity || ''}
                  onChange={(e) =>
                    setDraftItem((current) => ({
                      ...current,
                      quantity: e.target.valueAsNumber || 0,
                    }))
                  }
                />
              </div>
              <Button type='button' onClick={addItem}>
                <Plus size={16} />
                Adicionar
              </Button>
            </div>

            <div className='max-h-[260px] overflow-y-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className='h-16 text-center text-muted-foreground'>
                        Nenhum item adicionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
                      const product = selectedProducts[item.productId]

                      return (
                        <TableRow key={item.productId}>
                          <TableCell className='font-medium'>
                            {product?.name || item.productId}
                          </TableCell>
                          <TableCell>
                            {item.quantity} {product?.unit || ''}
                          </TableCell>
                          <TableCell>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='text-red-500'
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            Criar Produção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
