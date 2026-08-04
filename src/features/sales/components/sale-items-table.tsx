import { Trash2, PackageCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { type ProductSupplySearchItem } from '@/components/product-supply-combobox'
import { formatCurrency } from '../data/schema'

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
  kitItems: {
    productId: string
    productName: string
    quantity: number
    unit: string
  }[]
}

type SaleItemsTableProps = {
  items: ItemForm[]
  selectedProducts: Record<string, ProductSupplySearchItem>
  kitRefs: KitForm[]
  onUpdateItemQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onRemoveKit: (index: number) => void
}

export function SaleItemsTable({
  items,
  selectedProducts,
  kitRefs,
  onUpdateItemQuantity,
  onRemoveItem,
  onRemoveKit,
}: SaleItemsTableProps) {
  const hasItems = items.length > 0 || kitRefs.length > 0

  return (
    <div className='max-h-[300px] overflow-y-auto rounded-md border'>
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
            {!hasItems ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='h-16 text-center text-muted-foreground'
                >
                  Nenhum item adicionado.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.map((item, index) => {
                  const product = selectedProducts[item.productId]
                  const total = item.quantity * item.unitPrice
                  const quantityInvalid = item.quantity <= 0

                  return (
                    <TableRow key={`item-${item.productId}`}>
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
                              onUpdateItemQuantity(
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
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(total)}</TableCell>
                      <TableCell>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='text-red-500'
                          onClick={() => onRemoveItem(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {kitRefs.map((kit, kitIndex) => (
                  <TableRow
                    key={`kit-${kit.kitId}`}
                    className='bg-blue-50/50 dark:bg-blue-950/20'
                  >
                    <TableCell colSpan={3} className='font-medium'>
                      <div className='flex items-center gap-2'>
                        <Badge variant='blue' className='text-xs'>
                          <PackageCheck size={12} />
                          Kit
                        </Badge>
                        {kit.kitName}
                        <span className='text-xs text-muted-foreground'>
                          (
                          {kit.kitItems
                            .map(
                              (ki) =>
                                `${ki.quantity} ${ki.unit} de ${ki.productName}`
                            )
                            .join(', ')}
                          )
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {formatCurrency(kit.finalPrice)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='text-red-500'
                        onClick={() => onRemoveKit(kitIndex)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='space-y-2 p-2 sm:hidden'>
        {!hasItems ? (
          <div className='py-6 text-center text-sm text-muted-foreground'>
            Nenhum item adicionado.
          </div>
        ) : (
          <>
            {items.map((item, index) => {
              const product = selectedProducts[item.productId]
              const total = item.quantity * item.unitPrice

              return (
                <div
                  key={`item-${item.productId}`}
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
                      onClick={() => onRemoveItem(index)}
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
                            onUpdateItemQuantity(
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
            })}
            {kitRefs.map((kit, kitIndex) => (
              <div
                key={`kit-${kit.kitId}`}
                className='space-y-2 rounded-md border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2 font-medium'>
                    <Badge variant='blue' className='text-xs'>
                      Kit
                    </Badge>
                    {kit.kitName}
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='text-red-500'
                    onClick={() => onRemoveKit(kitIndex)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <div className='text-xs text-muted-foreground'>
                  {kit.kitItems
                    .map(
                      (ki) => `${ki.quantity} ${ki.unit} de ${ki.productName}`
                    )
                    .join(', ')}
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>Total</Label>
                  <div className='font-semibold'>
                    {formatCurrency(kit.finalPrice)}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
