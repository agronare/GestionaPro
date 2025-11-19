'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, ProductSchema } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Loader2, ArrowUpDown, Search, FileDown } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { objectImpOptions, ivaRateOptions, iepsRateOptions } from '@/lib/data/sat-catalogs';
import { salesUnitOptions, purchaseUnitOptions } from '@/lib/data/units-options';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';

const productSchema = ProductSchema;

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'products');
  }, [firestore, user]);
  const { data: products, isLoading: loading } = useCollection<Product>(productsCollection);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', sku: '', description: '', category: '', price: 0, cost: 0,
      companyName: '', activeIngredient: '',
      isBulk: false, salesUnit: '', purchaseUnit: '', conversionFactor: 1,
      technicalSheetUrl: '', applicationGuideUrl: '',
      objetoImp: '02', ivaRate: 0.16, iepsRate: 0,
    },
  });

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];
    let sortableProducts = [...products];

    // Filtrado
    if (searchTerm) {
        sortableProducts = sortableProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.activeIngredient && product.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // Ordenamiento
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA == null && valB == null) return 0;
        if (valA == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valB == null) return sortConfig.direction === 'asc' ? -1 : 1;
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableProducts;
  }, [products, searchTerm, sortConfig]);

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!firestore) return;
    const dataToSave = {
      ...values,
      price: values.price || 0,
      cost: values.cost || 0,
      isBulk: values.isBulk || false,
      conversionFactor: values.isBulk ? (values.conversionFactor || 1) : 1,
      ivaRate: values.ivaRate ?? 0,
      iepsRate: values.iepsRate ?? 0,
    };

    if (editingProduct) {
      const productRef = doc(firestore, 'products', editingProduct.id!);
      updateDocumentNonBlocking(productRef, dataToSave);
      toast({ title: 'Producto actualizado', description: 'Los cambios han sido guardados.' });
      setIsFormOpen(false);
      setEditingProduct(null);
    } else {
      addDocumentNonBlocking(collection(firestore, 'products'), dataToSave);
      toast({ title: 'Producto agregado', description: 'El nuevo producto ha sido creado.' });
      setIsFormOpen(false);
      setEditingProduct(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
        ...product,
        objetoImp: product.objetoImp || '02',
        ivaRate: product.ivaRate ?? 0.16,
        iepsRate: product.iepsRate ?? 0,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'products', id));
    toast({ title: 'Producto eliminado', variant: 'destructive' });
  };

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (key: keyof Product) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Catálogo de Productos", 105, 30, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });

        const tableColumn = ["SKU", "Nombre", "Categoría", "Precio Venta"];
        const tableRows: any[] = [];

        sortedAndFilteredProducts.forEach(product => {
            const productData = [
                product.sku,
                product.name,
                product.category,
                formatCurrency(product.price),
            ];
            tableRows.push(productData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            headStyles: { fillColor: '#2E7D32' } // Color corporativo
        });

        doc.save(`catalogo_productos_${Date.now()}.pdf`);
        toast({title: "Reporte PDF generado correctamente."});
    } catch (error) {
        toast({title: "No se pudo generar el PDF.", variant: "destructive"});
    } finally {
        setIsExporting(false);
    }
  };

  const watchIsBulk = useWatch({ control: form.control, name: 'isBulk' });
  const watchSalesUnit = useWatch({ control: form.control, name: 'salesUnit' });
  const watchPurchaseUnit = useWatch({ control: form.control, name: 'purchaseUnit' });
  const watchConversionFactor = useWatch({ control: form.control, name: 'conversionFactor' });
  
  const watchObjetoImp = useWatch({ control: form.control, name: 'objetoImp' });
  const taxesEnabled = watchObjetoImp === '02';

  useEffect(() => {
    if (watchObjetoImp === '04') { // Sí objeto y no causa impuesto (Tasa 0)
      form.setValue('ivaRate', 0);
      form.setValue('iepsRate', 0);
    } else if (watchObjetoImp !== '02') { // Si no es 'Sí objeto de impuesto', no debería haber tasas
      form.setValue('ivaRate', 0);
      form.setValue('iepsRate', 0);
    }
  }, [watchObjetoImp, form]);

  return (
    <div className="flex flex-col gap-6">
      <div className='flex items-center justify-between'>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">ERP / Productos</h1>
          <p className="text-muted-foreground">Gestión Administrativa.</p>
        </div>
      </div>
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Productos y Servicios</CardTitle>
          <div className="flex gap-2">
             <div className="relative flex-grow max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                      placeholder="Buscar por nombre o ingrediente..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <Button onClick={handleExportPDF} disabled={isExporting} variant="outline">
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Exportar PDF
              </Button>
              <Button onClick={() => { setEditingProduct(null); form.reset(); setIsFormOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Producto
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">Nombre {renderSortArrow('name')}</TableHead>
                  <TableHead onClick={() => handleSort('sku')} className="cursor-pointer">SKU {renderSortArrow('sku')}</TableHead>
                  <TableHead onClick={() => handleSort('price')} className="cursor-pointer">Precio Venta {renderSortArrow('price')}</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>${(product.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => product.id && handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Comercial</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><FormControl><Input placeholder="Ej: Herbicida, Fertilizante" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio de Venta</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Empresa / Fabricante</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="activeIngredient" render={({ field }) => (<FormItem><FormLabel>Ingrediente Activo</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-md font-medium">Impuestos (Configuración SAT)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="objetoImp" render={({ field }) => (<FormItem><FormLabel>Objeto de Impuesto</FormLabel><Select onValueChange={field.onChange} value={field.value ?? '02'}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{objectImpOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="ivaRate" render={({ field }) => (<FormItem><FormLabel>Tasa IVA</FormLabel><Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value ?? 0.16)} disabled={!taxesEnabled}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{ivaRateOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="iepsRate" render={({ field }) => (<FormItem><FormLabel>Tasa IEPS</FormLabel><Select onValueChange={(v) => field.onChange(parseFloat(v))} value={String(field.value ?? 0)} disabled={!taxesEnabled}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{iepsRateOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                   </div>
                </div>
                
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-md font-medium">Documentación Técnica (URLs)</h3>
                  <FormField control={form.control} name="technicalSheetUrl" render={({ field }) => (<FormItem><FormLabel>Ficha Técnica</FormLabel><FormControl><Input type="url" placeholder="https://" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="applicationGuideUrl" render={({ field }) => (<FormItem><FormLabel>Guía de Aplicación</FormLabel><FormControl><Input type="url" placeholder="https://" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <FormField control={form.control} name="isBulk" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>Venta a Granel</FormLabel></div>
                    <FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                {watchIsBulk && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="text-md font-medium">Unidades de Medida</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad de Compra</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {purchaseUnitOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="salesUnit" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad de Venta</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {salesUnitOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="conversionFactor" render={({ field }) => (<FormItem><FormLabel>Factor de Conversión</FormLabel><FormControl><Input type="number" placeholder="Ej: 20" {...field} value={field.value ?? 1} /></FormControl><FormMessage /></FormItem>)} />
                    <div className={cn("text-sm text-muted-foreground p-2 rounded-md bg-muted", (watchConversionFactor || 0) > 0 ? 'block' : 'hidden')}>
                      <Label>Equivalencia:</Label> 1 {watchPurchaseUnit || 'Unidad de Compra'} = {watchConversionFactor || 1} {watchSalesUnit || 'Unidad de Venta'}
                    </div>
                  </div>
                )}
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
