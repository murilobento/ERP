import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { queryKeys } from '@/lib/query-keys'
import api from '@/lib/api'
import {
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import {
  VendorCombobox,
  type VendorSearchItem,
} from '@/components/vendor-combobox'
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
import { usePurchases } from './purchases-provider'

type ItemForm = {
  supplyId: string
  packages: number
  packageCost: number
}

type PurchasesActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchasesActionDialog({
  open,
  onOpenChange,
}: PurchasesActionDialogProps) {
  const { run, isLoading } = useEntityMutation()
  const [vendorId, setVendorId] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<VendorSearchItem | null>(null)
  const [notes, setNotes] = useState('')
  const [draftItem, setDraftItem] = useState<ItemForm>({ supplyId: '', packages: 1, packageCost: 0 })
  const [items, setItems] = useState<ItemForm[]>([])
  const [selectedSupplies, setSelectedSupplies] = useState<
    Record<string, ProductSupplySearchItem>
  >({})
  const { currentRow } = usePurchases()

  const isEdit = !!currentRow && open

  function initWithCurrentRow() {
    if (currentRow && isEdit) {
      setVendorId(currentRow.vendorId || '')
      setSelectedVendor(currentRow.vendor)
      setNotes(currentRow.notes)
      setDraftItem({ supplyId: '', packages: 1, packageCost: 0 })
      setItems(
        currentRow.items.map((i) => ({
          supplyId: i.supplyId,
          packages: i.packages,
          packageCost: i.packageCost,
        }))
      )
      setSelectedSupplies(
        Object.fromEntries(currentRow.items.map((i) => [i.supplyId, i.supply]))
      )
    } else {
      setVendorId('')
      setSelectedVendor(null)
      setNotes('')
      setDraftItem({ supplyId: '', packages: 1, packageCost: 0 })
      setItems([])
      setSelectedSupplies({})
    }
  }

  function handleOpenChange(state: boolean) {
    if (state) initWithCurrentRow()
    onOpenChange(state)
  }

  function addItem() {
    if (!draftItem.supplyId || draftItem.packages <= 0) {
      toast.error('Selecione um insumo e informe a quantidade de embalagens.')
      return
    }
    if (items.some((item) => item.supplyId === draftItem.supplyId)) {
      toast.error('Este insumo já foi adicionado.')
      return
    }

    setItems([...items, draftItem])
    setDraftItem({ supplyId: '', packages: 1, packageCost: 0 })
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItemPackages(index: number, packages: number) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, packages } : item))
    )
  }

  function updateSelectedSupply(item: ProductSupplySearchItem | null) {
    if (!item) return
    setSelectedSupplies((current) => ({ ...current, [item.id]: item }))
  }

  async function onSubmit() {
    if (!vendorId) {
      toast.error('Fornecedor é obrigatório.')
      return
    }
    if (items.some((item) => item.packages <= 0)) {
      toast.error('A quantidade de cada item deve ser maior que zero.')
      return
    }
    const validItems = items.filter((i) => i.supplyId && i.packages > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    await run({
      mutation: async () => {
        const payload = { vendorId, notes, items: validItems }
        if (isEdit && currentRow) {
          await api.patch(`/purchases/${currentRow.id}`, payload)
        } else {
          await api.post('/purchases', payload)
        }
      },
      invalidate: [queryKeys.purchases],
      successMessage: isEdit
        ? 'Compra atualizada com sucesso.'
        : 'Compra criada com sucesso.',
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da compra.' : 'Registre uma nova compra de insumos.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
            <Label className='sm:col-span-2 sm:text-end'>Fornecedor</Label>
            <VendorCombobox
              value={vendorId}
              onValueChange={setVendorId}
              onVendorChange={setSelectedVendor}
              selectedVendor={selectedVendor}
              className='min-w-0 sm:col-span-4'
              placeholder='Selecione o fornecedor'
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

          <div className='space-y-2'>
            <Label className='mb-2 block text-sm font-medium'>Itens</Label>
            <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]'>
              <div className='min-w-0 sm:col-span-2 md:col-span-1'>
                <Label className='text-xs text-muted-foreground'>Insumo</Label>
                <ProductSupplyCombobox
                  type='supply'
                  value={draftItem.supplyId}
                  onValueChange={(val) =>
                    setDraftItem((current) => ({ ...current, supplyId: val }))
                  }
                  onItemChange={updateSelectedSupply}
                  selectedItem={selectedSupplies[draftItem.supplyId]}
                  placeholder='Selecione...'
                />
              </div>
              <div className='min-w-0'>
                <Label className='text-xs text-muted-foreground'>Quantidade</Label>
                <Input
                  type='number'
                  min='1'
                  step='1'
                  value={draftItem.packages || ''}
                  onChange={(e) =>
                    setDraftItem((current) => ({
                      ...current,
                      packages: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className='min-w-0'>
                <Label className='text-xs text-muted-foreground'>Preço emb. (R$)</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={draftItem.packageCost || ''}
                  onChange={(e) =>
                    setDraftItem((current) => ({
                      ...current,
                      packageCost: parseFloat(e.target.value) || 0,
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
                      <TableHead>Preço emb.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className='w-10' />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className='h-16 text-center text-muted-foreground'>
                          Nenhum item adicionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const supply = selectedSupplies[item.supplyId]
                        const total = supply
                          ? item.packages * (supply.packageQuantity || 1)
                          : 0
                        const packagesInvalid = item.packages <= 0

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
                                  aria-invalid={packagesInvalid}
                                  className='h-8 w-20'
                                  value={item.packages || ''}
                                  onChange={(e) =>
                                    updateItemPackages(
                                      index,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                                {supply?.packageUnit && (
                                  <span className='text-xs text-muted-foreground'>
                                    {supply.packageUnit}(s)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.packageCost > 0
                                ? `R$ ${item.packageCost.toFixed(2)}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {total} {supply?.unit || ''}
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
                    Nenhum item adicionado.
                  </div>
                ) : (
                  items.map((item, index) => {
                    const supply = selectedSupplies[item.supplyId]
                    const total = supply
                      ? item.packages * (supply.packageQuantity || 1)
                      : 0
                    const packagesInvalid = item.packages <= 0

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
                                aria-invalid={packagesInvalid}
                                className='h-8 w-20'
                                value={item.packages || ''}
                                onChange={(e) =>
                                  updateItemPackages(
                                    index,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                              {supply?.packageUnit && (
                                <span className='text-xs text-muted-foreground'>
                                  {supply.packageUnit}(s)
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className='text-xs text-muted-foreground'>
                              Preço emb.
                            </Label>
                            <div className='mt-1'>
                              {item.packageCost > 0
                                ? `R$ ${item.packageCost.toFixed(2)}`
                                : '—'}
                            </div>
                          </div>
                          <div className='col-span-2'>
                            <Label className='text-xs text-muted-foreground'>
                              Total
                            </Label>
                            <div className='mt-1 font-medium'>
                              {total} {supply?.unit || ''}
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
            {isEdit ? 'Salvar Alterações' : 'Criar Compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
