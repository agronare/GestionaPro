'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { CalendarIcon, PlusCircle, Trash2, Check, Search, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Quote, Supplier, Product } from '@/lib/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { useToast } from '@/hooks/use-toast';

type AddQuotationDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddQuotation: (data: any) => void;
  editingQuotation?: Quote | null;
  suppliers: Supplier[];
  products: Product[];
};

const productSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto."),
  productName: z.string(),
  price: z.coerce.number().min(0, "El precio debe ser un número positivo."),
});

const quotationSchema = z.object({
  quoteNumber: z.string(),
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  date: z.date(),
  agriculturalCampaign: z.string().optional(),
  items: z.array(productSchema).min(1, "Debes agregar al menos un producto."),
  status: z.enum(['Pendiente', 'Aprobada', 'Rechazada']).optional(),
});


export function AddQuotationDialog({
  isOpen,
  onOpenChange,
  onAddQuotation,
  editingQuotation,
  suppliers,
  products
}: AddQuotationDialogProps) {
  
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [lastCreatedQuote, setLastCreatedQuote] = useState<Quote | null>(null);

  const form = useForm<z.infer<typeof quotationSchema>>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quoteNumber: `COT-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      items: [{ productId: '', productName: '', price: 0 }],
      supplierId: '',
      agriculturalCampaign: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingQuotation) {
            form.reset({
                ...editingQuotation,
                quoteNumber: editingQuotation.quoteNumber,
                date: editingQuotation.date,
                items: editingQuotation.items.map(item => ({...item, price: item.price || 0})),
            });
        } else {
            form.reset({
                quoteNumber: `COT-${Date.now().toString().slice(-6)}`,
                date: new Date(),
                items: [{ productId: '', productName: '', price: 0 }],
                supplierId: '',
                agriculturalCampaign: '',
            });
        }
    }
  }, [isOpen, form, editingQuotation]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (data: z.infer<typeof quotationSchema>) => {
    onAddQuotation(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editingQuotation ? 'Editar Cotización' : 'Nueva Cotización'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                <FormItem><FormLabel>Número de Cotización</FormLabel><FormControl><Input placeholder="Ej: COT-2024-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                    <FormItem className="flex flex-col col-span-1">
                        <FormLabel>Proveedor</FormLabel>
                        <div className='flex gap-1'>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.map((supplier: Supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id!}>{supplier.companyName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Dialog open={isSupplierSearchOpen} onOpenChange={setIsSupplierSearchOpen}>
                                <DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></DialogTrigger>
                                <DialogContent className="p-0">
                                    <DialogHeader className="p-4 border-b">
                                        <DialogTitle>Buscar Proveedor</DialogTitle>
                                    </DialogHeader>
                                    <Command>
                                        <CommandInput placeholder="Buscar proveedor..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                                            <CommandGroup>
                                                {suppliers.map(s => (
                                                    <CommandItem key={s.id} value={s.companyName} onSelect={() => { form.setValue("supplierId", s.id!); setIsSupplierSearchOpen(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                                                        {s.companyName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Seleccionar fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
            </div>
            
             <FormField control={form.control} name="agriculturalCampaign" render={({ field }) => (
                <FormItem><FormLabel>Campaña Agrícola (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Siembra Primavera 2024" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            
            <div>
              <FormLabel>Productos Cotizados</FormLabel>
              <div className="space-y-2 pt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <FormField
                          control={form.control}
                          name={`items.${index}.productName`}
                          render={({ field: productNameField }) => (
                          <FormItem>
                              <div className="flex gap-2">
                                  <Input 
                                      placeholder="Nombre del producto" 
                                      {...productNameField} 
                                      onChange={(e) => {
                                          productNameField.onChange(e.target.value);
                                          form.setValue(`items.${index}.productId`, '');
                                      }}
                                  />
                                   <Dialog open={isProductSearchOpen && currentProductIndex === index} onOpenChange={(open) => {if (!open) setIsProductSearchOpen(false);}}>
                                      <DialogTrigger asChild>
                                          <Button type="button" variant="outline" size="icon" onClick={() => { setCurrentProductIndex(index); setIsProductSearchOpen(true);}}>
                                              <Search className="h-4 w-4"/>
                                          </Button>
                                      </DialogTrigger>
                                      <DialogContent className="p-0">
                                        <DialogHeader className="p-4 border-b">
                                            <DialogTitle>Buscar Producto</DialogTitle>
                                        </DialogHeader>
                                          <Command filter={(value, search) => {
                                              const product = products.find(p => p.name === value);
                                              if (!product) return 0;
                                              const match = product.name.toLowerCase().includes(search.toLowerCase()) || 
                                                            (product.activeIngredient && product.activeIngredient.toLowerCase().includes(search.toLowerCase()));
                                              return match ? 1 : 0;
                                          }}>
                                              <CommandInput placeholder="Buscar por nombre o ingrediente activo..." />
                                              <CommandList>
                                                  <CommandEmpty>
                                                      <div className="py-6 text-center text-sm">
                                                          No se encontraron productos.
                                                          <Button variant="link" className="mt-2" onClick={(e) => { e.preventDefault(); setIsNewProductDialogOpen(true); }}>
                                                              <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Producto
                                                          </Button>
                                                      </div>
                                                  </CommandEmpty>
                                                  <CommandGroup>
                                                      {products.map((p) => (
                                                          <CommandItem
                                                              key={p.id}
                                                              value={p.name}
                                                              onSelect={() => {
                                                                  form.setValue(`items.${index}.productId`, p.id!);
                                                                  form.setValue(`items.${index}.productName`, p.name);
                                                                  setIsProductSearchOpen(false);
                                                              }}
                                                          >
                                                              <Check className={cn("mr-2 h-4 w-4", form.getValues(`items.${index}.productId`) === p.id ? "opacity-100" : "opacity-0")} />
                                                              {p.name} <span className="text-xs text-muted-foreground ml-2">({p.activeIngredient || 'N/A'})</span>
                                                          </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                              </CommandList>
                                          </Command>
                                      </DialogContent>
                                  </Dialog>
                              </div>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField control={form.control} name={`items.${index}.price`} render={({ field: priceField }) => (
                        <FormItem><FormControl><Input type="number" step="0.01" placeholder="Precio" {...priceField} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: '', price: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Producto
                </Button>
              </div>
               <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingQuotation ? 'Guardar Cambios' : 'Crear Cotización'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
