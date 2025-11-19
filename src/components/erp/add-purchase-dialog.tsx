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
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Supplier } from '@/app/erp/suppliers/page';
import type { Product } from '@/app/erp/products/page';
import type { Quotation } from '@/app/erp/quotations/page';

type AddPurchaseDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPurchase: (data: any) => void;
};

const productSchema = z.object({
    productId: z.string().min(1, "Selecciona un producto."),
    quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
    cost: z.coerce.number().min(0, "El costo debe ser positivo."),
});

const extraCostSchema = z.object({
    description: z.string().min(1, "La descripción es requerida."),
    amount: z.coerce.number().min(0, "El monto debe ser positivo."),
});


const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  approvedQuotationId: z.string().optional(),
  agriculturalCampaign: z.string().optional(),
  paymentMethod: z.string().min(1, "Selecciona un método de pago."),
  products: z.array(productSchema).min(1, "Debes agregar al menos un producto."),
  extraCosts: z.array(extraCostSchema).optional(),
});

export function AddPurchaseDialog({
  isOpen,
  onOpenChange,
  onAddPurchase,
}: AddPurchaseDialogProps) {
  const firestore = useFirestore();
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const { data: suppliers } = useCollection<Supplier>(suppliersCollection);

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products } = useCollection<Product>(productsCollection);

  const quotationsCollection = useMemoFirebase(() => collection(firestore, 'quotations'), [firestore]);
  const { data: quotations } = useCollection<Quotation>(quotationsCollection);

  const form = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      paymentMethod: 'efectivo',
      products: [],
      extraCosts: [],
    },
  });

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const { fields: costFields, append: appendCost, remove: removeCost } = useFieldArray({
    control: form.control,
    name: "extraCosts",
  });

  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);

  const watchedProducts = form.watch('products');
  const watchedExtraCosts = form.watch('extraCosts');

  useEffect(() => {
    const productsTotal = watchedProducts?.reduce((acc, p) => acc + ((p.quantity || 0) * (p.cost || 0)), 0) || 0;
    const extraCostsTotal = watchedExtraCosts?.reduce((acc, c) => acc + (c.amount || 0), 0) || 0;
    
    const currentSubtotal = productsTotal + extraCostsTotal;
    const currentIva = currentSubtotal * 0.16;
    const currentTotal = currentSubtotal + currentIva;

    setSubtotal(currentSubtotal);
    setIva(currentIva);
    setTotal(currentTotal);

  }, [watchedProducts, watchedExtraCosts]);


  const onSubmit = (data: z.infer<typeof purchaseSchema>) => {
    const supplierName = suppliers?.find(s => s.id === data.supplierId)?.companyName || 'N/A';
    onAddPurchase({...data, supplierName});
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Compra</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="supplierId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proveedor</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="approvedQuotationId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cotización Aprobada</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {quotations?.map(q => <SelectItem key={q.id} value={q.id}>{q.quotationNumber}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="agriculturalCampaign"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Campaña Agrícola</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Primavera 2025" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Método de Pago</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                    <SelectItem value="transferencia">Transferencia</SelectItem>
                                    <SelectItem value="credito">Crédito</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <FormLabel>Productos</FormLabel>
                        {productFields.map((field, index) => (
                             <div key={field.id} className="flex items-start gap-2">
                                <FormField control={form.control} name={`products.${index}.productId`} render={({ field: selectField }) => (
                                    <FormItem className='flex-1'>
                                        <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Producto..." /></SelectTrigger></FormControl>
                                            <SelectContent>{products?.map(p => <SelectItem key={p.sku} value={p.sku}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name={`products.${index}.quantity`} render={({ field: inputField }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Cant." {...inputField} className="w-20" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`products.${index}.cost`} render={({ field: inputField }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Costo U." {...inputField} className="w-24" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)}><Trash2 className="text-destructive h-4 w-4" /></Button>
                            </div>
                        ))}
                         <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => appendProduct({ productId: '', quantity: 1, cost: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                        </Button>
                        {form.formState.errors.products && <p className="text-sm font-medium text-destructive">{typeof form.formState.errors.products === 'object' && 'message' in form.formState.errors.products ? form.formState.errors.products.message : ''}</p>}
                    </div>

                    <div className="space-y-2">
                        <FormLabel>Costos Adicionales</FormLabel>
                        {costFields.map((field, index) => (
                             <div key={field.id} className="flex items-start gap-2">
                                <FormField control={form.control} name={`extraCosts.${index}.description`} render={({ field: inputField }) => (
                                    <FormItem className='flex-1'><FormControl><Input placeholder="Descripción (Ej: Flete)" {...inputField} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`extraCosts.${index}.amount`} render={({ field: inputField }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Monto" {...inputField} className="w-28" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeCost(index)}><Trash2 className="text-destructive h-4 w-4" /></Button>
                            </div>
                        ))}
                         <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => appendCost({ description: '', amount: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Costo Extra
                        </Button>
                    </div>

                    <div className='flex flex-col items-end gap-1 text-sm pt-4'>
                        <p>Subtotal: <span className="font-semibold w-24 inline-block text-right">MXN {subtotal.toFixed(2)}</span></p>
                        <p>IVA (16%): <span className="font-semibold w-24 inline-block text-right">MXN {iva.toFixed(2)}</span></p>
                        <p>Descuento: <span className="font-semibold w-24 inline-block text-right">MXN 0.00</span></p>
                        <p className="text-base font-bold text-primary">Total: <span className="font-bold w-24 inline-block text-right">MXN {total.toFixed(2)}</span></p>
                    </div>

                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Guardar Compra</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
