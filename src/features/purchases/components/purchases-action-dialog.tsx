import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
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
  const [isLoading, setIsLoading] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<VendorSearchItem | null>(null)
  const [notes, setNotes] = useState('')
  const [draftItem, setDraftItem] = useState<ItemForm>({ supplyId: '', packages: 1, packageCost: 0 })
  const [items, setItems] = useState<ItemForm[]>([])
  const [selectedSupplies, setSelectedSupplies] = useState<
    Record<string, ProductSupplySearchItem>
  >({})
  const queryClient = useQueryClient()
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

  function updateSelectedSupply(item: ProductSupplySearchItem | null) {
    if (!item) return
    setSelectedSupplies((current) => ({ ...current, [item.id]: item }))
  }

  async function onSubmit() {
    if (!vendorId) {
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
          vendorId,
          notes,
          items: validItems,
        })
        toast.success('Compra atualizada com sucesso.')
      } else {
        await api.post('/purchases', {
          vendorId,
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
            <VendorCombobox
              value={vendorId}
              onValueChange={setVendorId}
              onVendorChange={setSelectedVendor}
              selectedVendor={selectedVendor}
              className='col-span-4'
              placeholder='Selecione o fornecedor'
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

          <div className='space-y-2'>
            <Label className='mb-2 block text-sm font-medium'>Itens</Label>
            <div className='grid grid-cols-[1fr_7rem_7rem_auto] items-end gap-2'>
              <div>
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
              <div>
                <Label className='text-xs text-muted-foreground'>Embalagens</Label>
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
              <div>
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
              <Button type='button' onClick={addItem}>
                <Plus size={16} />
                Adicionar
              </Button>
            </div>

            <div className='max-h-[260px] overflow-y-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Embalagens</TableHead>
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

                      return (
                        <TableRow key={item.supplyId}>
                          <TableCell className='font-medium'>
                            {supply?.name || item.supplyId}
                          </TableCell>
                          <TableCell>
                            {item.packages} {supply?.packageUnit || 'emb.'}(s)
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
