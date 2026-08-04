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
import { type Product } from '../data/schema'
import { useProducts } from './products-provider'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

type ProductsDetailDialogProps = {
  currentRow: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsDetailDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductsDetailDialogProps) {
  const { setOpen } = useProducts()

  const totalCost = currentRow.composition.reduce(
    (sum, item) => sum + item.quantity * item.supply.costPrice,
    0
  )

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
            {currentRow.category?.name || 'Sem categoria'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <div>
              <p className='text-xs text-muted-foreground'>Unidade</p>
              <p className='text-sm font-medium'>{currentRow.unit}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Estoque</p>
              <p className='text-sm font-medium'>
                <Badge variant={currentRow.stock > 0 ? 'default' : 'secondary'}>
                  {currentRow.stock}
                </Badge>
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Custo un.</p>
              <p className='text-sm font-medium'>
                {currentRow.costPrice
                  ? `${formatCurrency(currentRow.costPrice)}/${currentRow.unit}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Preço de venda</p>
              <p className='text-sm font-medium'>
                {currentRow.salePrice
                  ? `${formatCurrency(currentRow.salePrice)}/${currentRow.unit}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Margem</p>
              <p className='text-sm font-medium'>{currentRow.margin}%</p>
            </div>
          </div>

          {currentRow.description && (
            <div>
              <p className='text-xs text-muted-foreground'>Descrição</p>
              <p className='text-sm'>{currentRow.description}</p>
            </div>
          )}

          <div>
            <h4 className='mb-2 text-sm font-medium'>Composição</h4>
            {currentRow.composition.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Nenhum insumo na composição.
              </p>
            ) : (
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo un.</TableHead>
                      <TableHead>Custo total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRow.composition.map((item) => {
                      const unitCost = item.supply.costPrice
                      const total = item.quantity * unitCost
                      return (
                        <TableRow key={item.id}>
                          <TableCell className='font-medium'>
                            {item.supply.name}
                          </TableCell>
                          <TableCell>
                            {item.quantity} {item.supply.unit}
                          </TableCell>
                          <TableCell>{formatCurrency(unitCost)}</TableCell>
                          <TableCell>{formatCurrency(total)}</TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow>
                      <TableCell colSpan={3} className='text-end font-medium'>
                        Total
                      </TableCell>
                      <TableCell className='font-semibold'>
                        {formatCurrency(totalCost)}/{currentRow.unit}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
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

        <DialogFooter className='gap-2'>
          <Button onClick={handleEdit}>
            <Pen size={16} className='me-1' />
            Editar
          </Button>
          <Button variant='outline' onClick={() => handleClose(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
