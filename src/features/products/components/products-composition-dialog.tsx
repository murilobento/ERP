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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function ProductsCompositionDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductCompositionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [draftItem, setDraftItem] = useState<CompositionForm>({
    supplyId: '',
    quantity: 1,
  })
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
    if (!draftItem.supplyId || draftItem.quantity <= 0) {
      toast.error('Selecione um insumo e informe a quantidade.')
      return
    }
    if (items.some((item) => item.supplyId === draftItem.supplyId)) {
      toast.error('Este insumo já foi adicionado.')
      return
    }

    setItems([...items, { ...draftItem }])
    setDraftItem({ supplyId: '', quantity: 1 })
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItemQuantity(index: number, quantity: number) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, quantity } : item))
    )
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
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>Composição do Produto</DialogTitle>
          <DialogDescription>
            Defina os insumos e quantidades para produzir 1 unidade de{' '}
            <strong>{currentRow.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label className='mb-2 block text-sm font-medium'>Insumos</Label>
            <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_auto]'>
              <div className='min-w-0 sm:col-span-2 md:col-span-1'>
                <Label className='text-xs text-muted-foreground'>Insumo</Label>
                <ProductSupplyCombobox
                  type='supply'
                  value={draftItem.supplyId}
                  onValueChange={(val) =>
                    setDraftItem((current) => ({ ...current, supplyId: val }))
                  }
                  onItemChange={updateSupplyCache}
                  status='all'
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
                      <TableHead>Insumo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo un.</TableHead>
                      <TableHead>Custo total</TableHead>
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
                          Nenhum insumo adicionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const supply = supplyCache[item.supplyId]
                        const unitCost = supply?.costPrice ?? 0
                        const total = item.quantity * unitCost
                        const quantityInvalid = item.quantity <= 0

                        return (
                          <TableRow key={item.supplyId}>
                            <TableCell className='font-medium'>
                              {supply?.name || item.supplyId}
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
                                {supply?.unit && (
                                  <span className='text-xs text-muted-foreground'>
                                    {supply.unit}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {supply ? formatCurrency(unitCost) : '—'}
                            </TableCell>
                            <TableCell>
                              {supply ? formatCurrency(total) : '—'}
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
                    Nenhum insumo adicionado.
                  </div>
                ) : (
                  items.map((item, index) => {
                    const supply = supplyCache[item.supplyId]
                    const unitCost = supply?.costPrice ?? 0
                    const total = item.quantity * unitCost
                    const quantityInvalid = item.quantity <= 0

                    return (
                      <div
                        key={item.supplyId}
                        className='space-y-2 rounded-md border p-3'
                      >
                        <div className='flex items-start justify-between gap-2'>
                          <div className='font-medium'>
                            {supply?.name || item.supplyId}
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
                              {supply?.unit && (
                                <span className='text-xs text-muted-foreground'>
                                  {supply.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className='text-xs text-muted-foreground'>
                              Custo un.
                            </Label>
                            <div className='mt-1'>
                              {supply ? formatCurrency(unitCost) : '—'}
                            </div>
                          </div>
                          <div className='col-span-2'>
                            <Label className='text-xs text-muted-foreground'>
                              Custo total
                            </Label>
                            <div className='mt-1 font-medium'>
                              {supply ? formatCurrency(total) : '—'}
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

          {totalCost > 0 && (
            <div className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
              <span className='font-medium'>Custo total por unidade</span>
              <span className='font-semibold'>
                {formatCurrency(totalCost)}/{currentRow.unit}
              </span>
            </div>
          )}
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
