import { useState } from 'react'
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
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
import { formatCurrency, type Sale } from '../data/schema'

type ItemForm = {
  productId: string
  quantity: number
  unitPrice: number
}

interface SaleEditFormProps {
  sale: Sale
  isLoading: boolean
  onSave: (data: {
    clientId: string
    notes: string
    deliveryDate: Date | undefined
    items: ItemForm[]
  }) => void
  onCancel: () => void
}

export function SaleEditForm({
  sale,
  isLoading,
  onSave,
  onCancel,
}: SaleEditFormProps) {
  const [editClientId, setEditClientId] = useState(sale.clientId)
  const [editSelectedClient, setEditSelectedClient] =
    useState<ClientSearchItem | null>(sale.client)
  const [editNotes, setEditNotes] = useState(sale.notes)
  const [editDeliveryDate, setEditDeliveryDate] = useState<Date | undefined>(
    sale.deliveryDate ? new Date(sale.deliveryDate) : undefined
  )
  const [editDraftItem, setEditDraftItem] = useState<ItemForm>({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  })
  const [editItems, setEditItems] = useState<ItemForm[]>(
    sale.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }))
  )
  const [editSelectedProducts, setEditSelectedProducts] = useState<
    Record<string, ProductSupplySearchItem>
  >(
    Object.fromEntries(sale.items.map((i) => [i.productId, i.product]))
  )

  function addEditItem() {
    if (!editDraftItem.productId || editDraftItem.quantity <= 0) {
      toast.error('Selecione um produto e informe a quantidade.')
      return
    }
    if (editDraftItem.unitPrice < 0) {
      toast.error('O preço unitário não pode ser negativo.')
      return
    }
    if (editItems.some((item) => item.productId === editDraftItem.productId)) {
      toast.error('Este produto já foi adicionado.')
      return
    }
    setEditItems([...editItems, editDraftItem])
    setEditDraftItem({ productId: '', quantity: 1, unitPrice: 0 })
  }

  function removeEditItem(index: number) {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  function updateEditItemQuantity(index: number, quantity: number) {
    setEditItems((current) =>
      current.map((item, i) => (i === index ? { ...item, quantity } : item))
    )
  }

  function updateEditSelectedProduct(item: ProductSupplySearchItem | null) {
    if (!item) return
    setEditSelectedProducts((current) => ({ ...current, [item.id]: item }))
    if (item.salePrice !== undefined) {
      const rounded = Math.round(item.salePrice * 100) / 100
      setEditDraftItem((current) => ({ ...current, unitPrice: rounded }))
    }
  }

  function handleSave() {
    if (!editClientId) {
      toast.error('Cliente é obrigatório.')
      return
    }
    if (!editDeliveryDate) {
      toast.error('Data de entrega é obrigatória.')
      return
    }
    if (editItems.some((item) => item.quantity <= 0)) {
      toast.error('A quantidade de cada item deve ser maior que zero.')
      return
    }
    const validItems = editItems.filter((i) => i.productId && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    onSave({
      clientId: editClientId,
      notes: editNotes,
      deliveryDate: editDeliveryDate,
      items: validItems,
    })
  }

  return (
    <>
      <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
        <Label className='sm:col-span-2 sm:text-end'>Cliente</Label>
        <ClientCombobox
          value={editClientId}
          onValueChange={setEditClientId}
          onClientChange={setEditSelectedClient}
          selectedClient={editSelectedClient}
          className='min-w-0 sm:col-span-4'
        />
      </div>

      <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
        <Label className='sm:col-span-2 sm:text-end'>Observação</Label>
        <Input
          className='min-w-0 sm:col-span-4'
          placeholder='Opcional'
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          autoComplete='off'
        />
      </div>

      <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
        <Label className='sm:col-span-2 sm:text-end'>
          Data de entrega
        </Label>
        <div className='min-w-0 sm:col-span-4'>
          <DatePicker
            selected={editDeliveryDate}
            onSelect={setEditDeliveryDate}
            placeholder='Selecione a data'
            className='w-full'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='mb-2 block text-sm font-medium'>Itens</Label>
        <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]'>
          <div className='min-w-0 sm:col-span-2 md:col-span-1'>
            <Label className='text-xs text-muted-foreground'>
              Produto
            </Label>
            <ProductSupplyCombobox
              type='product'
              value={editDraftItem.productId}
              onValueChange={(val) =>
                setEditDraftItem((current) => ({
                  ...current,
                  productId: val,
                }))
              }
              onItemChange={updateEditSelectedProduct}
              selectedItem={
                editSelectedProducts[editDraftItem.productId]
              }
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
              value={editDraftItem.quantity || ''}
              onChange={(e) =>
                setEditDraftItem((current) => ({
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
              value={editDraftItem.unitPrice || ''}
              onChange={(e) =>
                setEditDraftItem((current) => ({
                  ...current,
                  unitPrice: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
          <Button
            type='button'
            onClick={addEditItem}
            className='w-full sm:col-span-2 md:col-span-1 md:w-auto'
          >
            <Plus size={16} />
            Adicionar
          </Button>
        </div>

        <div className='max-h-[200px] overflow-y-auto rounded-md border'>
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
                {editItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='h-16 text-center text-muted-foreground'
                    >
                      Nenhum item adicionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  editItems.map((item, index) => {
                    const product = editSelectedProducts[item.productId]
                    const itemTotal = item.quantity * item.unitPrice
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
                                updateEditItemQuantity(
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
                        <TableCell>
                          {formatCurrency(itemTotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='text-red-500'
                            onClick={() => removeEditItem(index)}
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
            {editItems.length === 0 ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                Nenhum item adicionado.
              </div>
            ) : (
              editItems.map((item, index) => {
                const product = editSelectedProducts[item.productId]
                const itemTotal = item.quantity * item.unitPrice
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
                        onClick={() => removeEditItem(index)}
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
                              updateEditItemQuantity(
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
                          {formatCurrency(itemTotal)}
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

      <DialogFooter className='gap-2'>
        <Button
          variant='outline'
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <CheckCircle2 size={16} className='me-1' />
          )}
          Salvar Alterações
        </Button>
      </DialogFooter>
    </>
  )
}
