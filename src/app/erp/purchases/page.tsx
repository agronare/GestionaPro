'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Supplier, Product, PurchaseOrder, PurchaseOrderStatus, InventoryItem, Quote, Branch, ProductSchema } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Loader2, CalendarIcon, AlertCircle, MoreHorizontal, BadgeCheck, CreditCard, AlertTriangle, Package, Truck, Filter, Search, Check, ChevronsUpDown, Download, FileText, QrCode, Send } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, Timestamp, query, runTransaction, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from '@/utils/formatters';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { PurchaseTicket } from '@/components/erp/purchases/PurchaseTicket';
import { QRCodeSVG } from 'qrcode.react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const associatedCostSchema = z.object({
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser positivo'),
  prorate: z.boolean().default(true),
});

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Producto es requerido'),
  productName: z.string(),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
  cost: z.coerce.number().min(0.01, 'El costo debe ser mayor a 0'),
  lotNumber: z.string().optional(),
  realCost: z.number().optional(), // Se calculará al guardar
});

const purchaseSchema = z.object({
  receptionId: z.string().optional(),
  supplierId: z.string().min(1, 'Proveedor es requerido'),
  branchId: z.string().min(1, 'Sucursal es requerida'),
  date: z.date({ required_error: 'La fecha es requerida' }),
  status: z.enum(['Pendiente', 'Completada', 'Cancelada']),
  items: z.array(purchaseItemSchema).min(1, 'Debe agregar al menos un producto'),
  associatedCosts: z.array(associatedCostSchema).optional(),
  notes: z.string().optional(),
  quoteId: z.string().optional(),
  paymentMethod: z.enum(['Efectivo', 'Tarjeta', 'Credito']).default('Efectivo'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;
const STATUS_OPTIONS: (PurchaseOrderStatus | 'all')[] = ['all', 'Pendiente', 'Completada', 'Cancelada'];

// Schema para el formulario rápido de producto
const quickProductSchema = ProductSchema.pick({
    name: true,
    sku: true,
    price: true,
    cost: true,
    category: true,
    activeIngredient: true,
});

export default function PurchasesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseOrder | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | 'all'>('all');
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<PurchaseOrder | null>(null);
  const [viewingQrCode, setViewingQrCode] = useState<PurchaseOrder | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  // Data fetching
  const purchasesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'purchases'));
  }, [firestore, user]);
  const { data: rawPurchases, isLoading: loadingPurchases } = useCollection<PurchaseOrder>(purchasesCollection);
  const suppliersCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'suppliers') : null, [firestore, user]);
  const { data: suppliers, isLoading: loadingSuppliers } = useCollection<Supplier>(suppliersCollection);
  const productsCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'products') : null, [firestore, user]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsCollection);
  const quotesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'quotations') : null, [firestore, user]);
  const { data: rawQuotes, isLoading: loadingQuotes } = useCollection<Quote>(quotesCollection);
  const branchesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'branches') : null, [firestore, user]);
  const { data: branches, isLoading: loadingBranches } = useCollection<Branch>(branchesCollection);

  const loading = loadingPurchases || loadingSuppliers || loadingProducts || loadingQuotes || loadingBranches;

  const purchases = useMemo(() => {
    if (!rawPurchases) return [];
    return rawPurchases.map(p => ({...p, date: (p.date as any).toDate()})).sort((a,b) => b.date.getTime() - a.date.getTime());
  }, [rawPurchases]);
  
  const quotes = useMemo(() => {
    if (!rawQuotes) return [];
    return rawQuotes.map(q => ({...q, date: (q.date as any).toDate()}));
  }, [rawQuotes]);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      branchId: '',
      date: new Date(),
      status: 'Pendiente',
      items: [],
      associatedCosts: [],
      receptionId: '',
      notes: '',
      quoteId: '',
      paymentMethod: 'Efectivo',
    },
  });

  const newProductForm = useForm<z.infer<typeof quickProductSchema>>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: { name: '', sku: `PROD-${Date.now()}`, price: 0, cost: 0, category: '', activeIngredient: '' },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem, replace: replaceItems } = useFieldArray({ control: form.control, name: "items" });
  const { fields: costFields, append: appendCost, remove: removeCost, replace: replaceCosts } = useFieldArray({ control: form.control, name: "associatedCosts" });
  
  const watchItems = useWatch({ control: form.control, name: 'items' });
  const watchCosts = useWatch({ control: form.control, name: 'associatedCosts' });
  const watchQuoteId = useWatch({ control: form.control, name: 'quoteId' });
  const watchSupplierId = useWatch({ control: form.control, name: 'supplierId' });
  const watchPaymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });

  const { subtotalProducts, totalAssociatedCosts, totalProratedCosts, totalOrder } = useMemo(() => {
    const subtotalProducts = watchItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    const totalAssociatedCosts = watchCosts?.reduce((acc, cost) => acc + Number(cost.amount || 0), 0) || 0;
    const totalProratedCosts = watchCosts?.filter(c => c.prorate).reduce((acc, cost) => acc + Number(cost.amount || 0), 0) || 0;
    const totalOrder = subtotalProducts + totalAssociatedCosts;
    return { subtotalProducts, totalAssociatedCosts, totalProratedCosts, totalOrder };
  }, [watchItems, watchCosts]);

  useEffect(() => {
    const supplier = suppliers?.find(s => s.id === watchSupplierId);
    setSelectedSupplier(supplier || null);
    if (supplier && !(supplier as any).hasCredit) {
      form.setValue('paymentMethod', 'Efectivo');
    }
  }, [watchSupplierId, suppliers, form]);

  const creditUsed = selectedSupplier?.creditUsed || 0;
  const creditLimit = selectedSupplier?.creditLimit || 0;
  const availableCredit = creditLimit - creditUsed;
  const creditError = watchPaymentMethod === 'Credito' && totalOrder > availableCredit;
  const creditUsagePercentage = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  const usedQuoteIds = useMemo(() => new Set(purchases.map(p => p.quoteId).filter(Boolean)), [purchases]);
  const approvedQuotes = useMemo(() => quotes.filter(q => q.status === 'Aprobada' && !usedQuoteIds.has(q.id)), [quotes, usedQuoteIds]);
  
  useEffect(() => {
    if (watchQuoteId) {
      const selectedQuote = quotes.find(q => q.id === watchQuoteId);
      if (selectedQuote) {
        form.setValue('supplierId', selectedQuote.supplierId);
        if (selectedQuote.campaign) { form.setValue('receptionId', selectedQuote.campaign); }
        const quoteItems = selectedQuote.items.map((item, index) => ({
          productId: item.productId!,
          productName: item.productName,
          quantity: 1,
          cost: item.price,
          lotNumber: `LOTE-${(index + 1).toString().padStart(3, '0')}`,
        }));
        replaceItems(quoteItems);
        toast({ title: 'Cotización Cargada', description: `Se han cargado los datos de la cotización ${selectedQuote.quoteNumber}.` });
      }
    }
  }, [watchQuoteId, quotes, replaceItems, form, toast]);

  const handleValidatePurchase = (purchase: PurchaseOrder) => { router.push(`/inventory-control?orderId=${purchase.id}`); };
  
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = term === '' || p.supplierName.toLowerCase().includes(term) || (p.receptionId && p.receptionId.toLowerCase().includes(term));
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, filterStatus]);
  
  const kpiData = useMemo(() => {
    return {
      total: purchases.length,
      completed: purchases.filter(p => p.status === 'Completada').length,
      pending: purchases.filter(p => p.status === 'Pendiente').length,
      suppliers: new Set(purchases.map(p => p.supplierId)).size,
    };
  }, [purchases]);

  const onNewProductSubmit = async (values: z.infer<typeof quickProductSchema>) => {
    if (!firestore) return;
    try {
        const fullProductData: z.infer<typeof ProductSchema> = {
            ...values,
            description: values.name,
            isBulk: false, salesUnit: 'Pieza', purchaseUnit: 'Pieza', conversionFactor: 1,
            objetoImp: '02', ivaRate: 0.16, iepsRate: 0,
        };
        const docRef = await addDocumentNonBlocking(collection(firestore, 'products'), fullProductData);
        if (docRef) {
            toast({ title: 'Producto Creado', description: 'El nuevo producto ha sido agregado al catálogo.' });
            form.setValue(`items.${currentProductIndex}.productId`, docRef.id);
            form.setValue(`items.${currentProductIndex}.productName`, values.name);
            form.setValue(`items.${currentProductIndex}.cost`, values.cost || 0);
            setIsNewProductDialogOpen(false);
            setIsProductSearchOpen(false);
            newProductForm.reset();
        } else {
            throw new Error("No se pudo obtener la referencia del nuevo documento.");
        }
    } catch (error) {
        console.error("Error creating quick product:", error);
        toast({ title: 'Error', description: 'No se pudo crear el nuevo producto.', variant: 'destructive' });
    }
  };
  
  const onSubmit = async (values: PurchaseFormValues) => {
    if (!firestore) return;
    try {
      const supplierName = suppliers?.find(s => s.id === values.supplierId)?.companyName || 'Desconocido';
        await runTransaction(firestore, async (transaction) => {
            const currentSupplier = suppliers?.find(s => s.id === values.supplierId);
            if (!currentSupplier) throw new Error("Proveedor no encontrado.");

            if (values.paymentMethod === 'Credito') {
                const supplierRef = doc(firestore, 'suppliers', currentSupplier.id!);
                const supplierDoc = await transaction.get(supplierRef);
                if (!supplierDoc.exists()) throw new Error("El proveedor no existe.");
                const available = (supplierDoc.data().creditLimit || 0) - (supplierDoc.data().creditUsed || 0);
                if (totalOrder > available) throw new Error(`Crédito insuficiente. Disponible: ${formatCurrency(available)}.`);
                transaction.update(supplierRef, { creditUsed: (supplierDoc.data().creditUsed || 0) + totalOrder });
            }

            const itemsWithNamesAndRealCost = values.items.map(item => {
                const product = products?.find(p => p.id === item.productId);
                const itemSubtotal = item.cost * item.quantity;
                const proratedCostRatio = subtotalProducts > 0 ? itemSubtotal / subtotalProducts : 0;
                const additionalCost = totalProratedCosts * proratedCostRatio;
                const realCost = item.quantity > 0 ? (itemSubtotal + additionalCost) / item.quantity : item.cost;
                return { ...item, productName: product?.name || 'Desconocido', realCost: parseFloat(realCost.toFixed(4)) };
            });

            const dataToSave: Omit<PurchaseOrder, 'id'> = {
                receptionId: values.receptionId,
                supplierId: values.supplierId,
                supplierName: currentSupplier.companyName,
                branchId: values.branchId,
                date: values.date,
                items: itemsWithNamesAndRealCost,
                associatedCosts: values.associatedCosts || [],
                total: totalOrder,
                status: values.status,
                notes: values.notes || '',
                quoteId: values.quoteId,
                paymentMethod: values.paymentMethod,
                previousStatus: editingPurchase?.status || 'Pendiente'
            };

            const processInventory = async (isCompletion: boolean) => {
                for (const item of itemsWithNamesAndRealCost) {
                    const product = products?.find(p => p.id === item.productId);
                    const conversionFactor = product?.conversionFactor || 1;
                    const stockToAdd = item.quantity * conversionFactor;
                    if (isCompletion) {
                        const newLotRef = doc(collection(firestore, 'inventory'));
                        const newLot: Omit<InventoryItem, 'id'> = {
                            productName: item.productName,
                            sku: item.productId,
                            branchId: values.branchId,
                            quantity: stockToAdd,
                            lot: item.lotNumber || `LOTE-${newLotRef.id.substring(0,6)}`,
                            unitPrice: item.realCost!,
                            entryDate: format(values.date, 'dd/MM/yyyy'),
                        };
                        transaction.set(newLotRef, newLot);
                        const productRef = doc(firestore, 'products', item.productId);
                        transaction.update(productRef, { cost: item.realCost! });
                    }
                }
            };
            
            if (editingPurchase) {
                const purchaseRef = doc(firestore, 'purchases', editingPurchase.id!);
                if (values.status === 'Completada' && editingPurchase.status !== 'Completada') { await processInventory(true); }
                transaction.set(purchaseRef, dataToSave, { merge: true });
            } else {
                const purchaseRef = doc(collection(firestore, 'purchases'));
                transaction.set(purchaseRef, dataToSave);
                if (values.status === 'Completada') { await processInventory(true); }
            }
        });
        toast({ title: editingPurchase ? 'Orden de Compra actualizada' : 'Orden de Compra creada' });
        setIsFormOpen(false);
        setEditingPurchase(null);
    } catch (error: any) {
        console.error("Error guardando orden de compra: ", error);
        toast({ title: 'Error', description: error.message || 'No se pudo guardar la orden de compra.', variant: 'destructive' });
    }
  };

  const handleEdit = (purchase: PurchaseOrder) => {
    setEditingPurchase(purchase);
    form.reset({
      ...purchase,
      date: purchase.date,
      items: [],
      associatedCosts: [],
    });
    replaceItems(purchase.items.map(item => ({...item, cost: item.cost || 0, quantity: item.quantity || 1, lotNumber: item.lotNumber || ''})));
    replaceCosts(purchase.associatedCosts || []);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if(!firestore) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "purchases", id));
      toast({ title: "Orden de compra eliminada", variant: "destructive" });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la orden.', variant: 'destructive' });
    }
  };

  const openNewDialog = () => {
    setEditingPurchase(null);
    form.reset({
      supplierId: '', branchId: '', date: new Date(), status: 'Pendiente', items: [],
      associatedCosts: [], receptionId: '', notes: '', quoteId: '', paymentMethod: 'Efectivo',
    });
    setIsFormOpen(true);
  };
  
  const getStatusVariant = (status: PurchaseOrderStatus) => {
    switch(status) {
        case 'Pendiente': return 'default';
        case 'Completada': return 'secondary';
        case 'Cancelada': return 'destructive';
        default: return 'outline';
    }
  }
  
  const KpiCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color: string }) => (
    <Card className="rounded-lg shadow-sm">
        <CardContent className="p-4 flex items-center">
            <div className={`p-3 rounded-full mr-4 ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </CardContent>
    </Card>
  );

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      // Logic to generate PDF...
      pdf.save('reporte_compras.pdf');
      toast({title: "Reporte de compras descargado."});
    } catch (error) {
      toast({title: "Error al generar el PDF.", variant: "destructive"});
    } finally {
      setIsExporting(false);
    }
  };

    const requestLogistics = async (purchase: PurchaseOrder) => {
        if (!firestore) return;
        try {
            await runTransaction(firestore, async (transaction) => {
                // 1. Update the purchase order
                const purchaseRef = doc(firestore, 'purchases', purchase.id!);
                transaction.update(purchaseRef, {
                    logisticsStatus: 'Solicitada',
                    logisticsStatusTimestamp: Timestamp.now()
                });

                // 2. Create the corresponding pickup order
                const pickupRef = doc(collection(firestore, 'pickups'));
                const supplier = suppliers?.find(s => s.id === purchase.supplierId);
                const newPickup = {
                    folio: `REC-${pickupRef.id.substring(0, 6)}`,
                    client: purchase.supplierName, // The supplier is the "client" for the pickup
                    origin: supplier?.address || 'Dirección no especificada', // Use supplier's address if available
                    scheduledDate: format(new Date(), 'dd/MM/yyyy'), // Scheduled for today
                    status: 'Programada' as const,
                    purchaseOrderId: purchase.id, // Link to the purchase order
                };
                transaction.set(pickupRef, newPickup);
            });

            toast({
                title: "Solicitud de Logística Enviada",
                description: "La recolección ha sido creada en el módulo de Logística.",
                variant: "default"
            });
        } catch (error) {
            console.error("Error creating logistics request:", error);
            toast({
                title: "Error",
                description: "No se pudo crear la solicitud de logística.",
                variant: "destructive"
            });
        }
    };
  
  const sendWhatsAppNotification = (purchase: PurchaseOrder) => {
    const branch = branches?.find(b => b.id === purchase.branchId);
    const logisticsPhone = '524432270901'; // Should be a config value
    if (logisticsPhone) {
        const message = `¡Nueva recolección solicitada!\n*Proveedor:* ${purchase.supplierName}\n*Orden No:* ${purchase.id?.substring(0, 7)}\n*Sucursal Destino:* ${branch?.name || 'No especificada'}\n*Ver en plataforma:* ${window.location.origin}/logistics/recolecciones`;
        const whatsappUrl = `https://wa.me/${logisticsPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    } else {
        toast({title: "No se configuró un número de WhatsApp para notificar a logística.", variant: 'destructive'});
    }
  };
  
  return (
    <>
    {viewingTicket && <PurchaseTicket purchase={viewingTicket} onClose={() => setViewingTicket(null)} />}
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Órdenes" value={kpiData.total} icon={Package} color="bg-blue-500" />
            <KpiCard title="Completadas" value={kpiData.completed} icon={BadgeCheck} color="bg-green-500" />
            <KpiCard title="Pendientes" value={kpiData.pending} icon={AlertTriangle} color="bg-yellow-500" />
            <KpiCard title="Proveedores" value={kpiData.suppliers} icon={Truck} color="bg-purple-500" />
        </div>

        <Card>
            <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
                 <div className="flex-grow max-w-md relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input placeholder="Buscar por proveedor o campaña..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PurchaseOrderStatus | 'all')}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {STATUS_OPTIONS.map(s => s !== 'all' && <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Exportar
                    </Button>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild><Button onClick={openNewDialog}><PlusCircle className="mr-2" />Nueva Orden</Button></DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
                            <DialogHeader><DialogTitle>{editingPurchase ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</DialogTitle></DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 overflow-auto p-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="quoteId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cargar desde Cotización (Opcional)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                                    <SelectContent>{approvedQuotes.map(q => <SelectItem key={q.id} value={q.id!}>{q.quoteNumber} - {q.supplierName}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="supplierId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Proveedor</FormLabel>
                                                <div className="flex gap-1">
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger></FormControl>
                                                        <SelectContent>{suppliers?.map(s => <SelectItem key={s.id} value={s.id!}>{s.companyName}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <Dialog open={isSupplierSearchOpen} onOpenChange={setIsSupplierSearchOpen}>
                                                        <DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Search className="h-4 w-4" /></Button></DialogTrigger>
                                                        <DialogContent className="p-0"><Command><CommandInput placeholder="Buscar proveedor..." /><CommandList><CommandEmpty>No se encontraron.</CommandEmpty><CommandGroup>{suppliers?.map(s => (<CommandItem key={s.id} value={s.companyName} onSelect={() => { form.setValue("supplierId", s.id!); setIsSupplierSearchOpen(false);}}><Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />{s.companyName}</CommandItem>))}</CommandGroup></CommandList></Command></DialogContent>
                                                    </Dialog>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="branchId" render={({ field }) => (<FormItem><FormLabel>Sucursal de Destino</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger></FormControl><SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id!}>{b.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Seleccionar</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange}/></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{STATUS_OPTIONS.map(s => s !== 'all' && <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="receptionId" render={({ field }) => (<FormItem><FormLabel>Campaña Agrícola (ID Recepción)</FormLabel><FormControl><Input {...field} placeholder="Ej: Primavera 2024" value={field.value || ''} /></FormControl></FormItem>)} />
                                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Método de Pago</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                              <SelectContent>
                                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                                                <SelectItem value="Credito" disabled={!selectedSupplier?.hasCredit}>Crédito</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas</FormLabel><FormControl><Input {...field} placeholder="Cualquier información adicional..." value={field.value || ''} /></FormControl></FormItem>)} />
                                    </div>
                                    <div className="pt-6">
                                        <h3 className="text-lg font-medium mb-2">Productos</h3>
                                        <div className="space-y-4">
                                            {itemFields.map((field, index) => (
                                                 <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md bg-muted/50">
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.productId`}
                                                        render={({ field: productField }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>Producto</FormLabel>
                                                            <div className="flex gap-1">
                                                                <Select onValueChange={productField.onChange} value={productField.value}>
                                                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar producto..."/></SelectTrigger></FormControl>
                                                                    <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent>
                                                                </Select>
                                                                <Dialog open={isProductSearchOpen && currentProductIndex === index} onOpenChange={(open) => {if (!open) setIsProductSearchOpen(false);}}>
                                                                    <DialogTrigger asChild><Button type="button" variant="outline" size="icon" onClick={() => { setCurrentProductIndex(index); setIsProductSearchOpen(true);}}><Search className="h-4 w-4"/></Button></DialogTrigger>
                                                                    <DialogContent className="p-0">
                                                                        <Command filter={(value, search) => {
                                                                            if (!products) return 0;
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
                                                                                            <PlusCircle className="mr-2 h-4 w-4"/> Crear Nuevo Producto
                                                                                        </Button>
                                                                                    </div>
                                                                                </CommandEmpty>
                                                                                <CommandGroup>{products?.map(p=><CommandItem key={p.id} value={p.name} onSelect={() => {form.setValue(`items.${index}.productId`, p.id!); setIsProductSearchOpen(false);}}><Check className={cn("mr-2 h-4 w-4", form.getValues(`items.${index}.productId`) === p.id ? "opacity-100" : "opacity-0")}/>{p.name}</CommandItem>)}</CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                        )}
                                                    />
                                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem><FormLabel>Cant.</FormLabel><FormControl><Input type="number" {...field} className="w-24"/></FormControl></FormItem>)} />
                                                    <FormField control={form.control} name={`items.${index}.cost`} render={({ field }) => (<FormItem><FormLabel>Costo</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="w-24"/></FormControl></FormItem>)} />
                                                    <FormField control={form.control} name={`items.${index}.lotNumber`} render={({ field }) => (<FormItem><FormLabel>Lote</FormLabel><FormControl><Input {...field} className="w-40"/></FormControl></FormItem>)} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                         <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendItem({ productId: '', productName: '', quantity: 1, cost: 0, lotNumber: `LOTE-${(itemFields.length + 1).toString().padStart(3, '0')}` })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Producto
                                        </Button>
                                     </div>
                                     <div className="flex justify-end pt-6">
                                        <Button type="submit" size="lg" disabled={form.formState.isSubmitting || creditError}>
                                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {editingPurchase ? 'Guardar Cambios' : 'Crear Orden de Compra'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">QR</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Logística</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredPurchases.map((purchase) => (
                            <TableRow key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div 
                                                    className="p-1 bg-white rounded-sm border inline-block cursor-pointer"
                                                    onClick={() => setViewingQrCode(purchase)}
                                                >
                                                    <QRCodeSVG value={purchase.id!} size={32} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>ID: {purchase.id}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>{purchase.supplierName}</TableCell>
                                <TableCell>{purchase.date ? format(purchase.date, 'dd MMM, yyyy') : 'N/A'}</TableCell>
                                <TableCell>{formatCurrency(purchase.total)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(purchase.status)}>{purchase.status}</Badge></TableCell>
                                 <TableCell>
                                    {purchase.logisticsStatus ? (
                                        <Badge variant={purchase.logisticsStatus === 'Recibido' ? 'default' : 'secondary'}>
                                            {purchase.logisticsStatus}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                     {purchase.status === 'Pendiente' && (
                                         <TooltipProvider>
                                             <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button onClick={() => requestLogistics(purchase)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors" variant="ghost" size="icon">
                                                        <Truck className="w-5 h-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Solicitar Recolección de Logística</p></TooltipContent>
                                             </Tooltip>
                                         </TooltipProvider>
                                     )}
                                    {purchase.logisticsStatus === 'Solicitada' && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button onClick={() => sendWhatsAppNotification(purchase)} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 transition-colors" variant="ghost" size="icon">
                                                        <Send className="w-5 h-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Notificar a Logística por WhatsApp</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button onClick={() => setViewingTicket(purchase)} className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors" variant="ghost" size="icon">
                                                    <FileText className="w-5 h-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Ver Ticket</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button onClick={() => handleEdit(purchase)} className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors" variant="ghost" size="icon">
                                                    <Edit className="w-5 h-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Editar</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <AlertDialog>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                    </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Eliminar</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro de eliminar esta orden?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            Esta acción no se puede deshacer.
                                            {purchase.status === 'Completada' && (
                                                <span className="mt-2 block font-bold text-destructive">
                                                Advertencia: Esta orden ya fue completada. Eliminarla no revertirá los cambios en el inventario.
                                                </span>
                                            )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                            onClick={() => handleDelete(purchase.id!)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                            Sí, eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredPurchases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No se encontraron órdenes de compra.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
    <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Crear Nuevo Producto Rápido</DialogTitle></DialogHeader>
            <Form {...newProductForm}>
                <form onSubmit={newProductForm.handleSubmit(onNewProductSubmit)} className="space-y-4">
                    <FormField control={newProductForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Producto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={newProductForm.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={newProductForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio Venta</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={newProductForm.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Costo Compra</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={newProductForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><FormControl><Input placeholder="Ej: Herbicida" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={newProductForm.control} name="activeIngredient" render={({ field }) => (<FormItem><FormLabel>Ingrediente Activo</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={newProductForm.formState.isSubmitting}>
                        {newProductForm.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : null}
                        Crear y Seleccionar
                    </Button>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
     <Dialog open={!!viewingQrCode} onOpenChange={() => setViewingQrCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR de Orden de Compra</DialogTitle>
          </DialogHeader>
          {viewingQrCode && (
            <div className="flex flex-col items-center justify-center p-6 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeSVG value={viewingQrCode.id!} size={256} />
              </div>
              <p className="font-mono text-sm text-muted-foreground">{viewingQrCode.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
