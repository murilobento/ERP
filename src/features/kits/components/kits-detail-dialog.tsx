import { Pen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Kit, formatCurrency } from '../data/schema'
import { useKits } from './kits-provider'

type KitsDetailDialogProps = {
  currentRow: Kit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KitsDetailDialog({
  currentRow,
  open,
  onOpenChange,
}: KitsDetailDialogProps) {
  const { setOpen } = useKits()

  if (!currentRow) return null

  function handleEdit() {
    setOpen('edit')
  }

  function handleClose(state: boolean) {
    if (!state) {
      onOpenChange(state)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <div className='flex items-center justify-between'>
            <DialogTitle>{currentRow.name}</DialogTitle>
            <Badge
              variant={currentRow.status === 'active' ? 'default' : 'secondary'}
            >
              {currentRow.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <DialogDescription>
            {currentRow.description || 'Sem descrição'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <div>
              <p className='text-xs text-muted-foreground'>Preço total</p>
              <p className='text-sm font-medium'>
                {formatCurrency(currentRow.totalPrice)}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Desconto</p>
              <p className='text-sm font-medium text-red-500'>
                -{formatCurrency(currentRow.discount)}
                {currentRow.discountType === 'percentage' &&
                  ` (${currentRow.discountValue}%)`}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Preço final</p>
              <p className='text-sm font-semibold text-green-600'>
                {formatCurrency(currentRow.finalPrice)}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Produtos</p>
              <p className='text-sm font-medium'>{currentRow.items.length}</p>
            </div>
          </div>

          <div>
            <h4 className='mb-2 text-sm font-medium'>Produtos do Kit</h4>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRow.items.map((item) => {
                    const costPrice = item.product.composition.reduce(
                      (sum, c) => sum + c.quantity * c.supply.costPrice,
                      0
                    )
                    const salePrice =
                      costPrice * (1 + item.product.margin / 100)
                    const total = salePrice * item.quantity
                    return (
                      <TableRow key={item.id}>
                        <TableCell className='font-medium'>
                          {item.product.name}
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.product.unit}
                        </TableCell>
                        <TableCell>{formatCurrency(total)}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow>
                    <TableCell colSpan={2} className='text-end font-medium'>
                      Total
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {formatCurrency(currentRow.totalPrice)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <p className='text-xs text-muted-foreground'>Criado em</p>
              <p className='text-sm'>
                {new Date(currentRow.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Atualizado em</p>
              <p className='text-sm'>
                {new Date(currentRow.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleEdit}>
            <Pen size={16} />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
