import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
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
import { Switch } from '@/components/ui/switch'
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
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import {
  formatCurrency,
  type Kit,
} from '../data/schema'

type ItemForm = {
  productId: string
  quantity: number
}

type KitsActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Kit | null
}

export function KitsActionDialog({
  open,
  onOpenChange,
  currentRow,
}: KitsActionDialogProps) {
  const isEdit = !!currentRow && open
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(isEdit ? currentRow!.name : '')
  const [description, setDescription] = useState(isEdit ? currentRow!.description : '')
  const [statusValue, setStatusValue] = useState(isEdit ? currentRow!.status : 'active')
  const [discountType, setDiscountType] = useState<string>(
    isEdit ? currentRow!.discountType : 'fixed'
  )
  const [discountValue, setDiscountValue] = useState<number>(
    isEdit ? currentRow!.discountValue : 0
  )
  const [draftItem, setDraftItem] = useState<ItemForm>({
    productId: '',
    quantity: 1,
  })
  const [items, setItems] = useState<ItemForm[]>(
    isEdit
      ? currentRow!.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        }))
      : []
  )
  const [productCache, setProductCache] = useState<
    Record<string, ProductSupplySearchItem>
  >(
    isEdit
      ? Object.fromEntries(
          currentRow!.items.map((i) => [
            i.productId,
            {
              id: i.product.id,
              name: i.product.name,
              unit: i.product.unit,
              status: i.product.status,
              salePrice: i.product.composition.reduce(
                (sum, c) => sum + c.quantity * c.supply.costPrice,
                0
              ) * (1 + i.product.margin / 100),
            } as ProductSupplySearchItem,
          ])
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

  function updateItemQuantity(index: number, quantity: number) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, quantity } : item))
    )
  }

  function updateSelectedProduct(item: ProductSupplySearchItem | null) {
    if (!item) return
    setProductCache((current) => ({ ...current, [item.id]: item }))
  }

  const kitTotalPrice = items.reduce((sum, item) => {
    const product = productCache[item.productId]
    if (!product?.salePrice) return sum
    return sum + product.salePrice * item.quantity
  }, 0)

  const kitDiscount =
    discountType === 'percentage'
      ? kitTotalPrice * (discountValue / 100)
      : discountValue

  const kitFinalPrice = Math.max(0, kitTotalPrice - kitDiscount)

  async function onSubmit() {
    if (!name.trim()) {
      toast.error('Nome é obrigatório.')
      return
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }
    if (items.some((item) => item.quantity <= 0)) {
      toast.error('A quantidade de cada item deve ser maior que zero.')
      return
    }
    if (discountType === 'percentage' && discountValue > 100) {
      toast.error('Desconto percentual não pode exceder 100%.')
      return
    }
    if (discountType === 'fixed' && discountValue > kitTotalPrice) {
      toast.error('Desconto não pode exceder o preço total.')
      return
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0)

    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        await api.patch(`/kits/${currentRow.id}`, {
          name: name.trim(),
          description: description.trim(),
          status: statusValue,
          discountType,
          discountValue,
          items: validItems,
        })
        toast.success('Kit atualizado com sucesso.')
      } else {
        await api.post('/kits', {
          name: name.trim(),
          description: description.trim(),
          status: statusValue,
          discountType,
          discountValue,
          items: validItems,
        })
        toast.success('Kit criado com sucesso.')
      }
      queryClient.invalidateQueries({ queryKey: ['kits'] })
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
          <div className='flex items-center justify-between'>
            <DialogTitle>{isEdit ? 'Editar Kit' : 'Novo Kit'}</DialogTitle>
            <div className='flex items-center gap-2'>
              <Switch
                checked={statusValue === 'active'}
                onCheckedChange={(checked) =>
                  setStatusValue(checked ? 'active' : 'inactive')
                }
              />
              <Label className='text-sm text-muted-foreground'>
                {statusValue === 'active' ? 'Ativo' : 'Inativo'}
              </Label>
            </div>
          </div>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do kit.' : 'Crie um novo kit com produtos.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Nome</Label>
            <Input
              className='min-w-0 sm:col-span-4'
              placeholder='Nome do kit'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete='off'
            />
          </div>

          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Descrição</Label>
            <Input
              className='min-w-0 sm:col-span-4'
              placeholder='Opcional'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete='off'
            />
          </div>

          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Tipo de desconto</Label>
            <Select value={discountType} onValueChange={setDiscountType}>
              <SelectTrigger className='min-w-0 sm:col-span-4'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='fixed'>Valor fixo (R$)</SelectItem>
                <SelectItem value='percentage'>Percentual (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>
              Desconto {discountType === 'percentage' ? '(%)' : '(R$)'}
            </Label>
            <Input
              type='number'
              min='0'
              max={discountType === 'percentage' ? '100' : undefined}
              step={discountType === 'percentage' ? '1' : '0.01'}
              className='min-w-0 sm:col-span-4'
              value={discountValue || ''}
              onChange={(e) =>
                setDiscountValue(parseFloat(e.target.value) || 0)
              }
              autoComplete='off'
            />
          </div>

          <div className='space-y-2'>
            <Label className='mb-2 block text-sm font-medium'>Produtos</Label>
            <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_auto]'>
              <div className='min-w-0 sm:col-span-2 md:col-span-1'>
                <Label className='text-xs text-muted-foreground'>Produto</Label>
                <ProductSupplyCombobox
                  type='product'
                  value={draftItem.productId}
                  onValueChange={(val) =>
                    setDraftItem((current) => ({ ...current, productId: val }))
                  }
                  onItemChange={updateSelectedProduct}
                  selectedItem={productCache[draftItem.productId]}
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
                          Nenhum produto adicionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const product = productCache[item.productId]
                        const unitPrice = product?.salePrice ?? 0
                        const total = item.quantity * unitPrice

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
                              {unitPrice > 0 ? formatCurrency(unitPrice) : '—'}
                            </TableCell>
                            <TableCell>
                              {total > 0 ? formatCurrency(total) : '—'}
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

              <div className='space-y-2 p-2 sm:hidden'>
                {items.length === 0 ? (
                  <div className='py-6 text-center text-sm text-muted-foreground'>
                    Nenhum produto adicionado.
                  </div>
                ) : (
                  items.map((item, index) => {
                    const product = productCache[item.productId]
                    const unitPrice = product?.salePrice ?? 0
                    const total = item.quantity * unitPrice

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
                              {unitPrice > 0 ? formatCurrency(unitPrice) : '—'}
                            </div>
                          </div>
                          <div className='col-span-2'>
                            <Label className='text-xs text-muted-foreground'>
                              Total
                            </Label>
                            <div className='mt-1 font-medium'>
                              {total > 0 ? formatCurrency(total) : '—'}
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

          {kitTotalPrice > 0 && (
            <div className='grid grid-cols-3 gap-2 rounded-md border px-3 py-2 text-sm'>
              <div>
                <p className='text-xs text-muted-foreground'>Preço total</p>
                <p className='font-medium'>{formatCurrency(kitTotalPrice)}</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Desconto</p>
                <p className='font-medium text-red-500'>
                  -{formatCurrency(kitDiscount)}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Preço final</p>
                <p className='font-semibold text-green-600'>
                  {formatCurrency(kitFinalPrice)}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className='animate-spin' />}
            {isEdit ? 'Salvar Alterações' : 'Criar Kit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
