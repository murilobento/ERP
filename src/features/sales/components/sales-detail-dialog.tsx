import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  formatCurrency,
  getSaleTotal,
  paymentMethodMap,
  type Sale,
} from '../data/schema'
import {
  SalesDetailView,
  SalesStatusBadge,
  type SalesDetailConfirmAction,
} from './sales-detail-view'
import { useSales } from './sales-provider'

type SaleResponse = {
  sale: Sale
}

type ItemForm = {
  productId: string
  quantity: number
  unitPrice: number
}

const actionCopy = {
  'ready-for-delivery': {
    title: 'Marcar como pronto para entrega?',
    description: 'A venda seguirá para a etapa de pronto para entrega.',
    button: 'Confirmar',
  },
  deliver: {
    title: 'Confirmar entrega da venda?',
    description: 'Os produtos serão baixados do estoque nesta etapa.',
    button: 'Confirmar Entrega',
  },
  complete: {
    title: 'Concluir venda?',
    description: 'Informe o pagamento para finalizar a venda.',
    button: 'Confirmar Conclusão',
  },
}

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function parseDateTimeLocal(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function setDatePreservingTime(date: Date | undefined, currentValue: string) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const time = currentValue.includes('T')
    ? currentValue.slice(currentValue.indexOf('T'))
    : 'T00:00'
  return `${year}-${month}-${day}${time}`
}

export function SalesDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useSales()
  const [isLoading, setIsLoading] = useState(false)
  const [confirmAction, setConfirmAction] =
    useState<SalesDetailConfirmAction>(null)
  const [reverseReason, setReverseReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paidAt, setPaidAt] = useState(toDateTimeLocal(new Date()))
  const [paymentNotes, setPaymentNotes] = useState('')
  const queryClient = useQueryClient()
  const currentRowId = currentRow?.id

  const [isEditing, setIsEditing] = useState(false)
  const [editClientId, setEditClientId] = useState('')
  const [editSelectedClient, setEditSelectedClient] =
    useState<ClientSearchItem | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editDeliveryDate, setEditDeliveryDate] = useState<Date | undefined>(
    undefined
  )
  const [editDraftItem, setEditDraftItem] = useState<ItemForm>({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  })
  const [editItems, setEditItems] = useState<ItemForm[]>([])
  const [editSelectedProducts, setEditSelectedProducts] = useState<
    Record<string, ProductSupplySearchItem>
  >({})

  const { data: detail } = useQuery({
    queryKey: ['sale', currentRowId],
    queryFn: async () => {
      const res = await api.get<SaleResponse>(`/sales/${currentRowId}`)
      return res.data.sale
    },
    enabled: open === 'view' && !!currentRow,
    staleTime: 0,
  })

  if (!currentRow) return null

  const sale = detail ?? currentRow
  const total = getSaleTotal(sale)
  const canEdit = sale.status !== 'completed'

  function resetActionState() {
    setConfirmAction(null)
    setReverseReason('')
    setPaymentMethod('')
    setPaidAt(toDateTimeLocal(new Date()))
    setPaymentNotes('')
  }

  function enterEditMode() {
    setEditClientId(sale.clientId)
    setEditSelectedClient(sale.client)
    setEditNotes(sale.notes)
    setEditDeliveryDate(
      sale.deliveryDate ? new Date(sale.deliveryDate) : undefined
    )
    setEditDraftItem({ productId: '', quantity: 1, unitPrice: 0 })
    setEditItems(
      sale.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }))
    )
    setEditSelectedProducts(
      Object.fromEntries(sale.items.map((i) => [i.productId, i.product]))
    )
    setIsEditing(true)
  }

  function exitEditMode() {
    setIsEditing(false)
  }

  function syncSale(updatedSale: Sale) {
    queryClient.setQueryData<Sale[]>(['sales'], (old) =>
      old?.map((item) => (item.id === updatedSale.id ? updatedSale : item))
    )
    queryClient.setQueryData<Sale>(['sale', updatedSale.id], updatedSale)
    setCurrentRow(updatedSale)
  }

  async function postAction(path: string, payload?: Record<string, unknown>) {
    setIsLoading(true)
    try {
      const { data } = await api.post<SaleResponse>(
        `/sales/${sale.id}/${path}`,
        payload
      )
      syncSale(data.sale)
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale', sale.id] })
      if (path === 'deliver' || path === 'reverse') {
        queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      }
      const messages: Record<string, string> = {
        'ready-for-delivery': 'Venda marcada como pronta para entrega.',
        deliver: 'Venda entregue. Estoque atualizado.',
        complete: 'Venda concluída.',
        reverse: 'Estorno realizado. Produtos devolvidos ao estoque.',
      }
      toast.success(messages[path])
      resetActionState()
      setOpen(null)
      setCurrentRow(null)
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  function confirmComplete() {
    if (!paymentMethod || !paidAt) {
      toast.error('Informe a forma e a data do pagamento.')
      return
    }
    postAction('complete', { paymentMethod, paidAt, paymentNotes })
  }

  function confirmReverse() {
    if (!reverseReason.trim()) {
      toast.error('Informe o motivo do estorno.')
      return
    }
    postAction('reverse', { reason: reverseReason.trim() })
  }

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

  async function saveEdit() {
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

    const year = editDeliveryDate.getFullYear()
    const month = String(editDeliveryDate.getMonth() + 1).padStart(2, '0')
    const day = String(editDeliveryDate.getDate()).padStart(2, '0')
    const deliveryDateStr = `${year}-${month}-${day}`

    setIsLoading(true)
    try {
      const { data } = await api.patch<SaleResponse>(`/sales/${sale.id}`, {
        clientId: editClientId,
        notes: editNotes,
        deliveryDate: deliveryDateStr,
        items: validItems,
      })
      syncSale(data.sale)
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale', sale.id] })
      toast.success('Venda atualizada com sucesso.')
      exitEditMode()
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Algo deu errado.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose(state: boolean) {
    if (!state) {
      resetActionState()
      exitEditMode()
      setOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
    }
  }

  return (
    <Dialog open={open === 'view'} onOpenChange={handleClose}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>
              {isEditing ? 'Editar Venda' : 'Detalhes da Venda'}
            </DialogTitle>
            <SalesStatusBadge sale={sale} />
          </div>
          <DialogDescription>
            Cliente: <strong>{sale.customer}</strong> · Total:{' '}
            <strong>{formatCurrency(total)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isEditing && (
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
                  onClick={exitEditMode}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button onClick={saveEdit} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    <CheckCircle2 size={16} className='me-1' />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing &&
            confirmAction &&
            confirmAction !== 'complete' &&
            confirmAction !== 'reverse' && (
              <>
                <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
                  <p className='font-medium text-green-600 dark:text-green-400'>
                    {actionCopy[confirmAction].title}
                  </p>
                  <p className='mt-1 text-muted-foreground'>
                    {actionCopy[confirmAction].description}
                  </p>
                </div>
                <DialogFooter className='gap-2'>
                  <Button
                    variant='outline'
                    onClick={resetActionState}
                    disabled={isLoading}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => postAction(confirmAction)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <CheckCircle2 size={16} className='me-1' />
                    )}
                    {actionCopy[confirmAction].button}
                  </Button>
                </DialogFooter>
              </>
            )}

          {!isEditing && confirmAction === 'complete' && (
            <>
              <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
                <p className='font-medium text-green-600 dark:text-green-400'>
                  Concluir venda?
                </p>
                <p className='mt-1 text-muted-foreground'>
                  Informe o pagamento para finalizar a venda.
                </p>
              </div>
              <div className='grid gap-3 rounded-md border p-3'>
                <div className='grid gap-2'>
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Selecione...' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodMap).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label>Data do pagamento</Label>
                  <DatePicker
                    selected={parseDateTimeLocal(paidAt)}
                    onSelect={(date) =>
                      setPaidAt(setDatePreservingTime(date, paidAt))
                    }
                    placeholder='Selecione a data'
                    className='w-full'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label>Observação</Label>
                  <Input
                    placeholder='Opcional'
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className='gap-2'>
                <Button
                  variant='outline'
                  onClick={resetActionState}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button onClick={confirmComplete} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    <CheckCircle2 size={16} className='me-1' />
                  )}
                  Confirmar Conclusão
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing && confirmAction === 'reverse' && (
            <>
              <div className='rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm'>
                <p className='font-medium text-destructive'>
                  Confirmar estorno da venda?
                </p>
                <p className='mt-1 text-muted-foreground'>
                  A venda voltará para em preparo e os produtos serão devolvidos
                  ao estoque.
                </p>
              </div>
              <div className='space-y-2 rounded-md border border-destructive/50 p-3'>
                <Label className='text-sm font-medium text-destructive'>
                  Motivo do Estorno *
                </Label>
                <Input
                  placeholder='Informe o motivo do estorno...'
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter className='gap-2'>
                <Button
                  variant='outline'
                  onClick={resetActionState}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant='destructive'
                  onClick={confirmReverse}
                  disabled={isLoading || !reverseReason.trim()}
                >
                  {isLoading ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    <RotateCcw size={16} className='me-1' />
                  )}
                  Confirmar Estorno
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing && !confirmAction && (
            <SalesDetailView
              sale={sale}
              canEdit={canEdit}
              isLoading={isLoading}
              onEdit={enterEditMode}
              onConfirmAction={setConfirmAction}
              onClose={() => handleClose(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
