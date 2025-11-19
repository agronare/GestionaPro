'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import type { InventoryItem } from '@/app/erp/inventory/page';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Branch } from '@/app/hr/branches/page';
import type { Product } from '@/app/erp/products/page';

type AddInventoryDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (data: Omit<InventoryItem, 'id' | 'entryDate'>) => void;
  editingItem?: InventoryItem;
};

const inventorySchema = z.object({
  productName: z.string().min(1, 'El nombre del producto es requerido.'),
  sku: z.string().min(1, 'El SKU es requerido.'),
  lot: z.string().min(1, 'El lote es requerido.'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1.'),
  unitPrice: z.coerce.number().min(0, 'El precio unitario no puede ser negativo.'),
  branchId: z.string().min(1, 'La sucursal es requerida.'),
});

export function AddInventoryDialog({
  isOpen,
  onOpenChange,
  onAddItem,
  editingItem,
}: AddInventoryDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const branchesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'branches');
  }, [firestore, user]);
  const { data: branches, isLoading: areBranchesLoading } = useCollection<Branch>(branchesCollection);
  
  const productsCollection = useMemoFirebase(() => {
    if(!user) return null;
    return collection(firestore, 'products');
  }, [firestore, user]);
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsCollection);


  const form = useForm<z.infer<typeof inventorySchema>>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      productName: '',
      sku: '',
      lot: '',
      quantity: 1,
      unitPrice: 0,
      branchId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingItem) {
            form.reset(editingItem);
        } else {
            form.reset({
                productName: '',
                sku: '',
                lot: '',
                quantity: 1,
                unitPrice: 0,
                branchId: '',
            });
        }
    }
  }, [editingItem, isOpen, form]);

  const handleProductChange = (productName: string) => {
    const selectedProduct = products?.find(p => p.name === productName);
    if (selectedProduct) {
        form.setValue('productName', selectedProduct.name);
        form.setValue('sku', selectedProduct.sku);
    }
  };


  const onSubmit = (data: z.infer<typeof inventorySchema>) => {
    onAddItem(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Lote' : 'Registrar Nuevo Lote'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areBranchesLoading || !!editingItem}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={areBranchesLoading ? "Cargando..." : "Seleccionar sucursal"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                   <Select onValueChange={handleProductChange} defaultValue={field.value} disabled={areProductsLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={areProductsLoading ? "Cargando..." : "Seleccionar producto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.sku} value={product.name}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: SULFOPOTGRAN50KG" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: LOTE-00123" {...field} disabled={!!editingItem} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Entrada</FormLabel>
                   <Input value={editingItem ? editingItem.entryDate : format(new Date(), 'dd/MM/yyyy')} disabled />
              </FormItem>
            <DialogFooter className='pt-4'>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">{editingItem ? 'Guardar Cambios' : 'Guardar Lote'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
