import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ClientCombobox,
  type ClientSearchItem,
} from '@/components/client-combobox'
import { DatePicker } from '@/components/date-picker'
import {
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import { formatCurrency } from '../data/schema'
import { useSales } from './sales-provider'

type ItemForm = {
  productId: string
  quantity: number
  unitPrice: number
}

type SalesActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesActionDialog({
  open,
  onOpenChange,
}: SalesActionDialogProps) {
  const { currentRow } = useSales()
  const isEdit = !!currentRow && open
  const [isLoading, setIsLoading] = useState(false)
  const [clientId, setClientId] = useState(isEdit ? currentRow.clientId : '')
  const [selectedClient, setSelectedClient] = useState<ClientSearchItem | null>(
    isEdit ? currentRow.client : null
  )
  const [notes, setNotes] = useState(isEdit ? currentRow.notes : '')
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    isEdit && currentRow.deliveryDate
      ? new Date(currentRow.deliveryDate)
      : undefined
  )
  const [draftItem, setDraftItem] = useState<ItemForm>({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  })
  const [items, setItems] = useState<ItemForm[]>(
    isEdit
      ? currentRow.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      : []
  )
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, ProductSupplySearchItem>
  >(
    isEdit
      ? Object.fromEntries(
          currentRow.items.map((i) => [i.productId, i.product])
        )
      : {}
  )
  const queryClient = useQueryClient()

  function handleOpenChange(state: boolean) {
    onOpenChange(state)
  }

  function addItem() {
    if (!draftItem.productId || draftItem.quantity <= 0) {
      toast.error('Selecione um produto e informe a quantidade.')
      return
    }
    if (draftItem.unitPrice < 0) {
      toast.error('O preço unitário não pode ser negativo.')
      return
    }
    if (items.some((item) => item.productId === draftItem.productId)) {
      toast.error('Este produto já foi adicionado.')
      return
    }

    setItems([...items, draftItem])
    setDraftItem({ productId: '', quantity: 1, unitPrice: 0 })
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItemQuantity(index: number, quantity: number) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, quantity } : item))
    )
  }

  function updateSelectedProduct(item: ProductSupplySearchItem | null) {
    if (!item) return
    setSelectedProducts((current) => ({ ...current, [item.id]: item }))
    if (item.salePrice !== undefined) {
      const rounded = Math.round(item.salePrice * 100) / 100
      setDraftItem((current) => ({ ...current, unitPrice: rounded }))
    }
  }

  async function onSubmit() {
    if (!clientId) {
      toast.error('Cliente é obrigatório.')
      return
    }
    if (!deliveryDate) {
      toast.error('Data de entrega é obrigatória.')
      return
    }
    if (items.some((item) => item.quantity <= 0)) {
      toast.error('A quantidade de cada item deve ser maior que zero.')
      return
    }
    const validItems = items.filter((i) => i.productId && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    const year = deliveryDate.getFullYear()
    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0')
    const day = String(deliveryDate.getDate()).padStart(2, '0')
    const deliveryDateStr = `${year}-${month}-${day}`

    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        await api.patch(`/sales/${currentRow.id}`, {
          clientId,
          notes,
          deliveryDate: deliveryDateStr,
          items: validItems,
        })
        toast.success('Venda atualizada com sucesso.')
      } else {
        await api.post('/sales', {
          clientId,
          notes,
          deliveryDate: deliveryDateStr,
          items: validItems,
        })
        toast.success('Venda criada com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['sales'] })
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
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados da venda.'
              : 'Registre uma nova venda.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Cliente</Label>
            <ClientCombobox
              value={clientId}
              onValueChange={setClientId}
              onClientChange={setSelectedClient}
              selectedClient={selectedClient}
              className='min-w-0 sm:col-span-4'
            />
          </div>

          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Observação</Label>
            <Input
              className='min-w-0 sm:col-span-4'
              placeholder='Opcional'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoComplete='off'
            />
          </div>

          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Data de entrega</Label>
            <div className='min-w-0 sm:col-span-4'>
              <DatePicker
                selected={deliveryDate}
                onSelect={setDeliveryDate}
                placeholder='Selecione a data'
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='mb-2 block text-sm font-medium'>Itens</Label>
            <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]'>
              <div className='min-w-0 sm:col-span-2 md:col-span-1'>
                <Label className='text-xs text-muted-foreground'>Produto</Label>
                <ProductSupplyCombobox
                  type='product'
                  value={draftItem.productId}
                  onValueChange={(val) =>
                    setDraftItem((current) => ({ ...current, productId: val }))
                  }
                  onItemChange={updateSelectedProduct}
                  selectedItem={selectedProducts[draftItem.productId]}
                  includeStock
                  placeholder='Selecione...'
                />
              </div>
              <div className='min-w-0'>
                <Label className='text-xs text-muted-foreground'>
                  Quantidade
                </Label>
                <Input
                  type='number'
                  min='1'
                  step='1'
                  value={draftItem.quantity || ''}
                  onChange={(e) =>
                    setDraftItem((current) => ({
                      ...current,
                      quantity: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className='min-w-0'>
                <Label className='text-xs text-muted-foreground'>
                  Preço un. (R$)
                </Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={draftItem.unitPrice || ''}
                  onChange={(e) =>
                    setDraftItem((current) => ({
                      ...current,
                      unitPrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <Button
                type='button'
                onClick={addItem}
                className='w-full sm:col-span-2 md:col-span-1 md:w-auto'
              >
                <Plus size={16} />
                Adicionar
              </Button>
            </div>

            <div className='max-h-[260px] overflow-y-auto rounded-md border'>
              <div className='hidden sm:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço un.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className='w-10' />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='h-16 text-center text-muted-foreground'
                        >
                          Nenhum item adicionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const product = selectedProducts[item.productId]
                        const total = item.quantity * item.unitPrice
                        const quantityInvalid = item.quantity <= 0

                        return (
                          <TableRow key={item.productId}>
                            <TableCell className='font-medium'>
                              {product?.name || item.productId}
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <Input
                                  type='number'
                                  min='1'
                                  step='1'
                                  aria-invalid={quantityInvalid}
                                  className='h-8 w-20'
                                  value={item.quantity || ''}
                                  onChange={(e) =>
                                    updateItemQuantity(
                                      index,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                                {product?.unit && (
                                  <span className='text-xs text-muted-foreground'>
                                    {product.unit}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell>{formatCurrency(total)}</TableCell>
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

              <div className='space-y-2 p-2 sm:hidden'>
                {items.length === 0 ? (
                  <div className='py-6 text-center text-sm text-muted-foreground'>
                    Nenhum item adicionado.
                  </div>
                ) : (
                  items.map((item, index) => {
                    const product = selectedProducts[item.productId]
                    const total = item.quantity * item.unitPrice
                    const quantityInvalid = item.quantity <= 0

                    return (
                      <div
                        key={item.productId}
                        className='space-y-2 rounded-md border p-3'
                      >
                        <div className='flex items-start justify-between gap-2'>
                          <div className='font-medium'>
                            {product?.name || item.productId}
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='text-red-500'
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <div className='grid grid-cols-2 gap-x-3 gap-y-2 text-sm'>
                          <div>
                            <Label className='text-xs text-muted-foreground'>
                              Quantidade
                            </Label>
                            <div className='mt-1 flex items-center gap-2'>
                              <Input
                                type='number'
                                min='1'
                                step='1'
                                aria-invalid={quantityInvalid}
                                className='h-8 w-20'
                                value={item.quantity || ''}
                                onChange={(e) =>
                                  updateItemQuantity(
                                    index,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                              {product?.unit && (
                                <span className='text-xs text-muted-foreground'>
                                  {product.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className='text-xs text-muted-foreground'>
                              Preço un.
                            </Label>
                            <div className='mt-1'>
                              {formatCurrency(item.unitPrice)}
                            </div>
                          </div>
                          <div className='col-span-2'>
                            <Label className='text-xs text-muted-foreground'>
                              Total
                            </Label>
                            <div className='mt-1 font-medium'>
                              {formatCurrency(total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            {isEdit ? 'Salvar Alterações' : 'Criar Venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
