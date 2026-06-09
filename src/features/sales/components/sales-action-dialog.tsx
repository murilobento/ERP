import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
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
  ClientCombobox,
  type ClientSearchItem,
} from '@/components/client-combobox'
import { DatePicker } from '@/components/date-picker'
import {
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import {
  KitCombobox,
  type KitSearchItem,
} from '@/components/kit-combobox'
import { formatCurrency } from '../data/schema'
import { useSales } from './sales-provider'
import { SaleItemsTable } from './sale-items-table'

type ItemForm = {
  productId: string
  quantity: number
  unitPrice: number
}

type KitForm = {
  kitId: string
  quantity: number
  kitName: string
  finalPrice: number
  kitItems: { productId: string; productName: string; quantity: number; unit: string }[]
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
  const [addMode, setAddMode] = useState<'product' | 'kit'>('product')

  const [draftItem, setDraftItem] = useState<ItemForm>({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  })
  const [items, setItems] = useState<ItemForm[]>(
    isEdit
      ? currentRow.items
          .filter((i) => !i.kitId)
          .map((i) => ({
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
          currentRow.items
            .filter((i) => !i.kitId)
            .map((i) => [i.productId, i.product])
        )
      : {}
  )

  const [draftKitId, setDraftKitId] = useState('')
  const [draftKitQuantity, setDraftKitQuantity] = useState(1)
  const [selectedKit, setSelectedKit] = useState<KitSearchItem | null>(null)
  const [kitRefs, setKitRefs] = useState<KitForm[]>(
    isEdit
      ? Object.values(
          currentRow.items
            .filter((i) => i.kitId)
            .reduce(
              (acc, i) => {
                if (!acc[i.kitId!]) {
                  acc[i.kitId!] = {
                    kitId: i.kitId!,
                    quantity: i.quantity,
                    kitName: i.kit?.name || '',
                    finalPrice: 0,
                    kitItems: [],
                  }
                }
                acc[i.kitId!].kitItems.push({
                  productId: i.productId,
                  productName: i.product.name,
                  quantity: i.quantity,
                  unit: i.product.unit,
                })
                return acc
              },
              {} as Record<string, KitForm>
            )
        )
      : []
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

  function addKit() {
    if (!draftKitId) {
      toast.error('Selecione um kit.')
      return
    }
    if (draftKitQuantity <= 0) {
      toast.error('A quantidade deve ser maior que zero.')
      return
    }
    if (kitRefs.some((k) => k.kitId === draftKitId)) {
      toast.error('Este kit já foi adicionado.')
      return
    }
    if (!selectedKit) return

    const kitForm: KitForm = {
      kitId: draftKitId,
      quantity: draftKitQuantity,
      kitName: selectedKit.name,
      finalPrice: selectedKit.finalPrice * draftKitQuantity,
      kitItems: selectedKit.items.map((ki) => ({
        productId: ki.productId,
        productName: ki.product.name,
        quantity: ki.quantity * draftKitQuantity,
        unit: ki.product.unit,
      })),
    }

    setKitRefs([...kitRefs, kitForm])
    setDraftKitId('')
    setDraftKitQuantity(1)
    setSelectedKit(null)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function removeKit(index: number) {
    setKitRefs(kitRefs.filter((_, i) => i !== index))
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
    if (validItems.length === 0 && kitRefs.length === 0) {
      toast.error('Adicione pelo menos um item ou kit.')
      return
    }

    const year = deliveryDate.getFullYear()
    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0')
    const day = String(deliveryDate.getDate()).padStart(2, '0')
    const deliveryDateStr = `${year}-${month}-${day}`

    const payload: Record<string, unknown> = {
      clientId,
      notes,
      deliveryDate: deliveryDateStr,
      items: validItems,
    }

    if (kitRefs.length > 0) {
      payload.kits = kitRefs.map((k) => ({
        kitId: k.kitId,
        quantity: k.quantity,
      }))
    }

    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        await api.patch(`/sales/${currentRow.id}`, payload)
        toast.success('Venda atualizada com sucesso.')
      } else {
        await api.post('/sales', payload)
        toast.success('Venda criada com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      onOpenChange(false)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const standaloneTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const kitsTotal = kitRefs.reduce((sum, k) => sum + k.finalPrice, 0)
  const saleTotal = standaloneTotal + kitsTotal

  const hasItems = items.length > 0 || kitRefs.length > 0

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
            <div className='flex items-center gap-2'>
              <Label className='text-sm font-medium'>Itens</Label>
              <div className='flex gap-1'>
                <Button
                  type='button'
                  variant={addMode === 'product' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setAddMode('product')}
                >
                  Produto
                </Button>
                <Button
                  type='button'
                  variant={addMode === 'kit' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setAddMode('kit')}
                >
                  <PackageCheck size={14} />
                  Kit
                </Button>
              </div>
            </div>

            {addMode === 'product' ? (
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
            ) : (
              <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_auto]'>
                <div className='min-w-0 sm:col-span-2 md:col-span-1'>
                  <Label className='text-xs text-muted-foreground'>Kit</Label>
                  <KitCombobox
                    value={draftKitId}
                    onValueChange={setDraftKitId}
                    onItemChange={setSelectedKit}
                    selectedItem={selectedKit}
                    placeholder='Selecione o kit...'
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
                    value={draftKitQuantity || ''}
                    onChange={(e) =>
                      setDraftKitQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <Button
                  type='button'
                  onClick={addKit}
                  className='w-full sm:col-span-2 md:col-span-1 md:w-auto'
                >
                  <Plus size={16} />
                  Adicionar Kit
                </Button>
              </div>
            )}

            <SaleItemsTable
              items={items}
              selectedProducts={selectedProducts}
              kitRefs={kitRefs}
              onUpdateItemQuantity={updateItemQuantity}
              onRemoveItem={removeItem}
              onRemoveKit={removeKit}
            />
          </div>

          {hasItems && (
            <div className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
              <span className='font-medium'>Total da venda</span>
              <span className='text-lg font-bold'>
                {formatCurrency(saleTotal)}
              </span>
            </div>
          )}
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
