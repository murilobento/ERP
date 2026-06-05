import { useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  Pen,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Badge } from '@/components/ui/badge'
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
import { type Purchase, purchaseStatusMap } from '../data/schema'
import { usePurchases } from './purchases-provider'

type PurchaseResponse = {
  purchase: Purchase
}

type EditItemForm = {
  supplyId: string
  packages: number
  packageCost: number
}

export function PurchasesDetailDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = usePurchases()
  const [isLoading, setIsLoading] = useState(false)
  const [showReverse, setShowReverse] = useState(false)
  const [reverseReason, setReverseReason] = useState('')
  const [confirmComplete, setConfirmComplete] = useState(false)
  const queryClient = useQueryClient()
  const currentRowId = currentRow?.id

  const [isEditing, setIsEditing] = useState(false)
  const [editVendorId, setEditVendorId] = useState('')
  const [editSelectedVendor, setEditSelectedVendor] =
    useState<VendorSearchItem | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editDraftItem, setEditDraftItem] = useState<EditItemForm>({
    supplyId: '',
    packages: 1,
    packageCost: 0,
  })
  const [editItems, setEditItems] = useState<EditItemForm[]>([])
  const [editSelectedSupplies, setEditSelectedSupplies] = useState<
    Record<string, ProductSupplySearchItem>
  >({})

  const { data: detail } = useQuery({
    queryKey: ['purchase', currentRowId],
    queryFn: async () => {
      const res = await api.get<PurchaseResponse>(`/purchases/${currentRowId}`)
      return res.data.purchase
    },
    enabled: open === 'view' && !!currentRow,
    staleTime: 0,
  })

  if (!currentRow) return null

  const purchase = detail ?? currentRow
  const statusConfig = purchaseStatusMap[purchase.status] || { label: purchase.status, variant: 'secondary' as const }
  const canEdit = purchase.status === 'pending'

  function syncPurchase(updatedPurchase: Purchase) {
    queryClient.setQueryData<Purchase[]>(['purchases'], (old) =>
      old?.map((item) =>
        item.id === updatedPurchase.id ? updatedPurchase : item
      )
    )

    queryClient.setQueryData<Purchase>(
      ['purchase', updatedPurchase.id],
      updatedPurchase
    )

    setCurrentRow(updatedPurchase)
  }

  function enterEditMode() {
    setEditVendorId(purchase.vendorId || '')
    setEditSelectedVendor(purchase.vendor)
    setEditNotes(purchase.notes)
    setEditDraftItem({ supplyId: '', packages: 1, packageCost: 0 })
    setEditItems(
      purchase.items.map((i) => ({
        supplyId: i.supplyId,
        packages: i.packages,
        packageCost: i.packageCost,
      }))
    )
    setEditSelectedSupplies(
      Object.fromEntries(purchase.items.map((i) => [i.supplyId, i.supply]))
    )
    setIsEditing(true)
  }

  function exitEditMode() {
    setIsEditing(false)
  }

  function updateEditSelectedSupply(item: ProductSupplySearchItem | null) {
    if (!item) return
    setEditSelectedSupplies((current) => ({ ...current, [item.id]: item }))
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

  async function saveEdit() {
    if (!editVendorId) {
      toast.error('Fornecedor é obrigatório.')
      return
    }
    if (editItems.some((item) => item.packages <= 0)) {
      toast.error('A quantidade de embalagens de cada item deve ser maior que zero.')
      return
    }
    const validItems = editItems.filter((i) => i.supplyId && i.packages > 0)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }

    setIsLoading(true)
    try {
      const { data } = await api.patch<PurchaseResponse>(
        `/purchases/${purchase.id}`,
        {
          vendorId: editVendorId,
          notes: editNotes,
          items: validItems,
        }
      )
      syncPurchase(data.purchase)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', purchase.id] })
      toast.success('Compra atualizada com sucesso.')
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

  async function handleComplete() {
    if (!currentRow) return
    setIsLoading(true)
    try {
      const { data } = await api.post<PurchaseResponse>(
        `/purchases/${currentRow.id}/complete`
      )
      syncPurchase(data.purchase)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', currentRow.id] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Compra concluída. Estoque atualizado.')
      setConfirmComplete(false)
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

  async function handleReverse() {
    if (!currentRow || !reverseReason.trim()) return
    setIsLoading(true)
    try {
      const { data } = await api.post<PurchaseResponse>(
        `/purchases/${currentRow.id}/reverse`,
        { reason: reverseReason.trim() }
      )
      syncPurchase(data.purchase)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', currentRow.id] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Estorno realizado. Estoque revertido.')
      setShowReverse(false)
      setReverseReason('')
      setConfirmComplete(false)
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

  function handleClose(state: boolean) {
    if (!state) {
      setShowReverse(false)
      setReverseReason('')
      setConfirmComplete(false)
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
              {isEditing ? 'Editar Compra' : 'Detalhes da Compra'}
            </DialogTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <DialogDescription>
            Fornecedor: <strong>{purchase.supplier}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isEditing && (
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
                    <Label className='text-xs text-muted-foreground'>
                      Insumo
                    </Label>
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
                      <Label className='text-xs text-muted-foreground'>
                      Quantidade
                    </Label>
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

          {!isEditing && confirmComplete && (
            <>
              <div className='rounded-md border border-green-600/50 bg-green-600/10 px-4 py-3 text-sm'>
                <p className='font-medium text-green-600 dark:text-green-400'>Confirmar conclusão da compra?</p>
                <p className='mt-1 text-muted-foreground'>O estoque dos insumos será atualizado. Esta ação não pode ser desfeita.</p>
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => setConfirmComplete(false)} disabled={isLoading}>
                  Voltar
                </Button>
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <CheckCircle2 size={16} className='me-1' />}
                  Confirmar Conclusão
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing && showReverse && (
            <>
              <div className='rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm'>
                <p className='font-medium text-destructive'>Confirmar estorno da compra?</p>
                <p className='mt-1 text-muted-foreground'>O estoque será revertido e a compra voltará para pendente.</p>
              </div>
              <div className='space-y-2 rounded-md border border-destructive/50 p-3'>
                <Label className='text-sm font-medium text-destructive'>Motivo do Estorno *</Label>
                <Input
                  placeholder='Informe o motivo do estorno...'
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={() => { setShowReverse(false); setReverseReason('') }} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button variant='destructive' onClick={handleReverse} disabled={isLoading || !reverseReason.trim()}>
                  {isLoading ? <Loader2 className='animate-spin' /> : <RotateCcw size={16} className='me-1' />}
                  Confirmar Estorno
                </Button>
              </DialogFooter>
            </>
          )}

          {!isEditing && !confirmComplete && !showReverse && (
            <>
              <div>
                <h4 className='mb-2 text-sm font-medium'>Itens</h4>
                <div className='space-y-1'>
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                    >
                      <span>{item.supply.name}</span>
                      <div className='flex items-center gap-2'>
                        {item.packageCost > 0 && (
                          <>
                            <span className='text-muted-foreground'>
                              R$ {item.packageCost.toFixed(2)}/{item.supply.packageUnit || 'emb.'}
                            </span>
                            <span className='text-muted-foreground'>·</span>
                          </>
                        )}
                        <span className='text-muted-foreground'>
                          {item.packages} {item.supply.packageUnit || 'emb.'}(s)
                        </span>
                        <span className='text-muted-foreground'>=</span>
                        <strong>{item.quantity} {item.supply.unit}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {purchase.notes && (
                <div>
                  <h4 className='mb-1 text-sm font-medium'>Observação</h4>
                  <p className='text-sm text-muted-foreground'>{purchase.notes}</p>
                </div>
              )}

              {purchase.reversedAt && (
                <div className='rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2'>
                  <h4 className='mb-1 text-sm font-medium text-destructive'>Estorno</h4>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(purchase.reversedAt).toLocaleString()}
                  </p>
                  {purchase.reversalReason && (
                    <p className='mt-1 text-sm'>Motivo: {purchase.reversalReason}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className='mb-1 text-sm font-medium'>Criada em</h4>
                <p className='text-sm text-muted-foreground'>
                  {new Date(purchase.createdAt).toLocaleString()}
                </p>
              </div>

              {purchase.completedAt && (
                <div>
                  <h4 className='mb-1 text-sm font-medium'>Concluída em</h4>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(purchase.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <DialogFooter className='gap-2'>
                {canEdit && (
                  <Button onClick={enterEditMode} disabled={isLoading}>
                    <Pen size={16} className='me-1' />
                    Editar
                  </Button>
                )}
                {purchase.status === 'pending' && (
                  <>
                    <Button onClick={() => setConfirmComplete(true)} disabled={isLoading}>
                      {isLoading ? <Loader2 className='animate-spin' /> : <CheckCircle2 size={16} className='me-1' />}
                      Concluir
                    </Button>
                    <Button variant='outline' onClick={() => setOpen(null)}>
                      Fechar
                    </Button>
                  </>
                )}
                {purchase.status === 'completed' && (
                  <>
                    <Button variant='destructive' onClick={() => setShowReverse(true)}>
                      <RotateCcw size={16} className='me-1' />
                      Estornar
                    </Button>
                    <Button variant='outline' onClick={() => setOpen(null)}>
                      Fechar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
