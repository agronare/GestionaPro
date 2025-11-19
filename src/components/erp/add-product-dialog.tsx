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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect } from 'react';
// Local Product interface replacing invalid import (module did not export Product)
interface Product {
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  manufacturer: string;
  activeIngredient: string;
  salePrice: number;
  standardCost?: number | null;
  satTax?: string | null;
  technicalSheetUrl?: string | null;
  applicationGuideUrl?: string | null;
  bulk: boolean;
  purchaseUnit?: string | null;
  bulkUnit?: string | null;
  conversionFactor?: number | null;
  cost: number;
}
import { cn } from '@/lib/utils';

type AddProductDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (data: z.infer<typeof productSchema>) => void;
  editingProduct?: Product;
};

const productSchema = z.object({
  sku: z.string().min(1, { message: 'El SKU es requerido.' }),
  name: z.string().min(1, { message: 'El nombre comercial es requerido.' }),
  description: z.string().optional(),
  category: z.string().min(1, { message: 'La categoría es requerida.' }),
  manufacturer: z.string().min(1, { message: 'El fabricante es requerido.' }),
  activeIngredient: z.string().min(1, { message: 'El ingrediente activo es requerido.' }),
  salePrice: z.coerce.number().min(0, { message: 'El precio debe ser un número positivo.' }),
  standardCost: z.coerce.number().optional(),
  satTax: z.string().optional(),
  technicalSheetUrl: z.string().url({ message: 'URL inválida' }).optional().or(z.literal('')),
  applicationGuideUrl: z.string().url({ message: 'URL inválida' }).optional().or(z.literal('')),
  bulk: z.boolean().default(false),
  purchaseUnit: z.string().optional(),
  bulkUnit: z.string().optional(),
  conversionFactor: z.coerce.number().optional(),
});

function FormSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {children}
        </div>
    )
}

const bulkUnits = [
  'pieza', 'caja', 'pallet', 'saco', 'costal', 'bulto', 'cubeta', 'tambo', 'botella', 'garrafa', 'bidón', 'kg', 'lt'
];

export function AddProductDialog({
  isOpen,
  onOpenChange,
  onAddProduct,
  editingProduct,
}: AddProductDialogProps) {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: '',
      manufacturer: '',
      activeIngredient: '',
      salePrice: 0,
      standardCost: 0,
      technicalSheetUrl: '',
      applicationGuideUrl: '',
      bulk: false,
      purchaseUnit: '',
      bulkUnit: '',
      conversionFactor: 1,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingProduct) {
            // Sanitize nullable fields and omit unsupported 'cost' property for form reset
            const {
              cost,
              sku,
              name,
              description,
              category,
              manufacturer,
              activeIngredient,
              salePrice,
              satTax,
              technicalSheetUrl,
              applicationGuideUrl,
              bulk,
              purchaseUnit,
              bulkUnit,
              conversionFactor,
            } = editingProduct;
            form.reset({
              sku,
              name,
              description: description ?? '',
              category,
              manufacturer,
              activeIngredient,
              salePrice,
              standardCost: cost,
              satTax: satTax ?? 'none',
              technicalSheetUrl: technicalSheetUrl ?? '',
              applicationGuideUrl: applicationGuideUrl ?? '',
              bulk,
              purchaseUnit: purchaseUnit ?? '',
              bulkUnit: bulkUnit ?? '',
              conversionFactor: conversionFactor ?? 1,
            });
        } else {
            form.reset({
              sku: '',
              name: '',
              description: '',
              category: '',
              manufacturer: '',
              activeIngredient: '',
              salePrice: 0,
              standardCost: 0,
              satTax: 'none',
              technicalSheetUrl: '',
              applicationGuideUrl: '',
              bulk: false,
              purchaseUnit: '',
              bulkUnit: '',
              conversionFactor: 1,
            });
        }
    }
  }, [editingProduct, isOpen, form]);

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    // Create a mutable copy of the data
    const dataToSave: { [key: string]: any } = { ...data };

    // Convert undefined to null
    for (const key in dataToSave) {
        if (dataToSave[key] === undefined) {
            dataToSave[key] = null;
        }
    }
    
    // If not bulk, remove bulk-related fields
    if (!dataToSave.bulk) {
        delete dataToSave.purchaseUnit;
        delete dataToSave.bulkUnit;
        delete dataToSave.conversionFactor;
    }

    onAddProduct(dataToSave as z.infer<typeof productSchema>);
    onOpenChange(false);
  };
  
  const isBulk = form.watch('bulk');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[70vh] pr-6">
                    <div className="space-y-6 py-4">
                        <FormSection title="IDENTIFICACIÓN">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>SKU</FormLabel>
                                    <FormControl>
                                        <Input placeholder="SULFOPOTGRAN50KC" {...field} disabled={!!editingProduct} />
                                    </FormControl>
                                    <FormDescription>Identificador único para inventario y compras.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre Comercial</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sulfato de potasio 50k" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descripción breve del producto..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </FormSection>

                        <FormSection title="DATOS TÉCNICOS Y AGRONÓMICOS">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <FormControl><Input placeholder="Fertilizante" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="manufacturer" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa / Fabricante</FormLabel>
                                        <FormControl><Input placeholder="ACME Agro" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="activeIngredient" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ingrediente Activo</FormLabel>
                                        <FormControl><Input placeholder="Sulfato" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </FormSection>

                        <FormSection title="PRECIOS E IMPUESTOS">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="salePrice" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Venta (MXN)</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormItem>
                                    <FormLabel>Costo (auto)</FormLabel>
                                    <FormControl><Input type="number" value={editingProduct?.cost || 0} disabled /></FormControl>
                                    <FormDescription>Calculado con compras registradas.</FormDescription>
                                </FormItem>
                                 <FormField control={form.control} name="standardCost" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Costo estándar (opcional)</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                        <FormDescription>Si lo estableces, el sistema lo usará como costo efectivo.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                             <FormField
                                control={form.control}
                                name="satTax"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Impuesto SAT</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione una opción" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="none">Sin impuesto</SelectItem>
                                        <SelectItem value="iva-16">IVA 16%</SelectItem>
                                        <SelectItem value="iva-8">IVA 8%</SelectItem>
                                        <SelectItem value="iva-0">IVA 0%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </FormSection>

                        <FormSection title="DOCUMENTACIÓN TÉCNICA">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="technicalSheetUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ficha Técnica (URL)</FormLabel>
                                        <FormControl><Input placeholder="https://.../ficha.pdf" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="applicationGuideUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Guía de Aplicación (URL)</FormLabel>
                                        <FormControl><Input placeholder="https://.../guia.pdf" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </FormSection>

                        <FormSection title="VENTA A GRANEL">
                             <FormField
                                control={form.control}
                                name="bulk"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-4">
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Producto a granel
                                        </FormLabel>
                                        <FormDescription>
                                            Habilita esta opción si el producto se vende en unidades fraccionadas (ej. por Kilo o Litro).
                                        </FormDescription>
                                    </div>
                                    </FormItem>
                                )}
                            />
                            <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 mt-4", !isBulk && "hidden")}>
                                <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidad de compra</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {bulkUnits.map(unit => <SelectItem key={`purchase-${unit}`} value={unit}>{unit}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="bulkUnit" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidad de granel</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                 {bulkUnits.map(unit => <SelectItem key={`bulk-${unit}`} value={unit}>{unit}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="conversionFactor" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Factor conversión</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormDescription className="text-xs">Cuántas unidades de granel hay en 1 unidad de compra.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </FormSection>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                </Button>
                <Button type="submit">{editingProduct ? 'Guardar Cambios' : 'Guardar'}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
