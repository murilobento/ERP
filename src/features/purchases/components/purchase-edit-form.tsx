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
  ProductSupplyCombobox,
  type ProductSupplySearchItem,
} from '@/components/product-supply-combobox'
import {
  VendorCombobox,
  type VendorSearchItem,
} from '@/components/vendor-combobox'
import { type Purchase } from '../data/schema'

type EditItemForm = {
  supplyId: string
  packages: number
  packageCost: number
}

type PurchaseEditFormProps = {
  purchase: Purchase
  isLoading: boolean
  onSave: (data: {
    vendorId: string
    notes: string
    items: EditItemForm[]
  }) => void
  onCancel: () => void
}

export function PurchaseEditForm({
  purchase,
  isLoading,
  onSave,
  onCancel,
}: PurchaseEditFormProps) {
  const [editVendorId, setEditVendorId] = useState(purchase.vendorId || '')
  const [editSelectedVendor, setEditSelectedVendor] =
    useState<VendorSearchItem | null>(purchase.vendor)
  const [editNotes, setEditNotes] = useState(purchase.notes)
  const [editDraftItem, setEditDraftItem] = useState<EditItemForm>({
    supplyId: '',
    packages: 1,
    packageCost: 0,
  })
  const [editItems, setEditItems] = useState<EditItemForm[]>(
    purchase.items.map((i) => ({
      supplyId: i.supplyId,
      packages: i.packages,
      packageCost: i.packageCost,
    }))
  )
  const [editSelectedSupplies, setEditSelectedSupplies] = useState<
    Record<string, ProductSupplySearchItem>
  >(Object.fromEntries(purchase.items.map((i) => [i.supplyId, i.supply])))

  function updateEditSelectedSupply(item: ProductSupplySearchItem | null) {
    if (!item) return
    setEditSelectedSupplies((current) => ({
      ...current,
      [item.id]: item,
    }))
  }

  function addEditItem() {
    if (!editDraftItem.supplyId || editDraftItem.packages <= 0) {
      toast.error('Selecione um insumo e informe a quantidade de embalagens.')
      return
    }
    if (editItems.some((item) => item.supplyId === editDraftItem.supplyId)) {
      toast.error('Este insumo já foi adicionado.')
      return
    }
    setEditItems([...editItems, editDraftItem])
    setEditDraftItem({ supplyId: '', packages: 1, packageCost: 0 })
  }

  function removeEditItem(index: number) {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  function updateEditItemPackages(index: number, packages: number) {
    setEditItems((current) =>
      current.map((item, i) => (i === index ? { ...item, packages } : item))
    )
  }

  function handleSave() {
    if (!editVendorId) {
      toast.error('Fornecedor é obrigatório.')
      return
    }
    if (editItems.some((item) => item.packages <= 0)) {
      toast.error(
        'A quantidade de embalagens de cada item deve ser maior que zero.'
      )
      return
    }
    const validItems = editItems.filter((i) => i.supplyId && i.packages > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    onSave({
      vendorId: editVendorId,
      notes: editNotes,
      items: validItems,
    })
  }

  return (
    <>
      <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-6 sm:items-center'>
        <Label className='sm:col-span-2 sm:text-end'>Fornecedor</Label>
        <VendorCombobox
          value={editVendorId}
          onValueChange={setEditVendorId}
          onVendorChange={setEditSelectedVendor}
          selectedVendor={editSelectedVendor}
          className='min-w-0 sm:col-span-4'
          placeholder='Selecione o fornecedor'
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

      <div className='space-y-2'>
        <Label className='mb-2 block text-sm font-medium'>Itens</Label>
        <div className='grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]'>
          <div className='min-w-0 sm:col-span-2 md:col-span-1'>
            <Label className='text-xs text-muted-foreground'>Insumo</Label>
            <ProductSupplyCombobox
              type='supply'
              value={editDraftItem.supplyId}
              onValueChange={(val) =>
                setEditDraftItem((current) => ({
                  ...current,
                  supplyId: val,
                }))
              }
              onItemChange={updateEditSelectedSupply}
              selectedItem={editSelectedSupplies[editDraftItem.supplyId]}
              placeholder='Selecione...'
            />
          </div>
          <div className='min-w-0'>
            <Label className='text-xs text-muted-foreground'>Quantidade</Label>
            <Input
              type='number'
              min='1'
              step='1'
              value={editDraftItem.packages || ''}
              onChange={(e) =>
                setEditDraftItem((current) => ({
                  ...current,
                  packages: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className='min-w-0'>
            <Label className='text-xs text-muted-foreground'>
              Preço emb. (R$)
            </Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={editDraftItem.packageCost || ''}
              onChange={(e) =>
                setEditDraftItem((current) => ({
                  ...current,
                  packageCost: parseFloat(e.target.value) || 0,
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
                    const supply = editSelectedSupplies[item.supplyId]
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
                                updateEditItemPackages(
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
                const supply = editSelectedSupplies[item.supplyId]
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
                            aria-invalid={packagesInvalid}
                            className='h-8 w-20'
                            value={item.packages || ''}
                            onChange={(e) =>
                              updateEditItemPackages(
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

      <DialogFooter className='gap-2'>
        <Button variant='outline' onClick={onCancel} disabled={isLoading}>
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
