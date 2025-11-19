'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, Client, Sale, SaleItem, InventoryItem, ProductWithInventory, SaleSchema, Branch } from '@/lib/types';
import { PlusCircle, Loader2, Trash2, Search, AlertCircle, User, Leaf, AlertTriangle, Sparkles, FileText, BadgeCheck, UserPlus, ChevronsUpDown, Check, Download, MoreHorizontal } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, getDocs, addDoc, doc, runTransaction, Timestamp, query, where, updateDoc, QuerySnapshot, getDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { getRecommendations } from '@/lib/data/recommendations';
import { Label } from '@/components/ui/label';
import { getSatClaveProdServ, getSatClaveUnidad } from '@/lib/data/sat-catalogs';
import { formatCurrency } from '@/utils/formatters';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketPrinter } from '@/components/erp/sales/TicketPrinter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const PUBLIC_GENERAL_ID = "public_general";
type SaleFormValues = z.infer<typeof SaleSchema>;
const IVA_RATE = 0.16;
const ZERO_RATE_CATEGORIES = ['FERTILIZANTE', 'ADHERENTE'];

function SalesForm({ products, clients, inventory, onSaleCreated, onDownloadPDF, branches }: {
    products: Product[];
    clients: Client[];
    inventory: InventoryItem[];
    onSaleCreated: (sale: Sale) => void;
    onDownloadPDF: () => void;
    branches: Branch[];
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<SaleFormValues>({
        resolver: zodResolver(SaleSchema),
        defaultValues: { branchId: '', clientId: PUBLIC_GENERAL_ID, items: [], paymentMethod: 'Efectivo' },
    });
    const { control, handleSubmit, setValue, formState: { errors } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const watchBranchId = useWatch({ control, name: 'branchId' });
    const watchClientId = useWatch({ control, name: 'clientId' });
    const watchItems = useWatch({ control, name: 'items' });
    const watchPaymentMethod = useWatch({ control, name: 'paymentMethod' });
    
    const { totalAmount, subtotal, totalIva } = useMemo(() => {
        let subtotal = 0;
        let totalIva = 0;
        watchItems.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const totalItemPrice = (item?.price || 0) * (item?.quantity || 0);

            const isZeroRate = product?.objetoImp === '04' || (product && ZERO_RATE_CATEGORIES.includes(product.category.toUpperCase()));
            const itemIvaRate = isZeroRate ? 0 : (product?.ivaRate ?? IVA_RATE);
            
            subtotal += totalItemPrice;
            totalIva += totalItemPrice * itemIvaRate;
        });
        const totalAmount = subtotal + totalIva;
        return { totalAmount, subtotal, totalIva };
    }, [watchItems, products]);


    const creditUsed = selectedClient?.creditUsed || 0;
    const creditLimit = selectedClient?.creditLimit || 0;
    const availableCredit = creditLimit - creditUsed;
    const isPublicGeneral = watchClientId === PUBLIC_GENERAL_ID;
    const creditError = watchPaymentMethod === 'Credito' && totalAmount > availableCredit;
    const creditUsagePercentage = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;
    const hasInventoryError = Array.isArray(errors.items) && errors.items.some(item => !!(item as any)?.quantity);
    const productsWithInventory: ProductWithInventory[] = useMemo(() => {
        if (!watchBranchId || !products || !inventory) return [];
        
        return products.map(p => {
            const stock = inventory
                .filter(item => item.sku === p.sku && item.branchId === watchBranchId)
                .reduce((sum, item) => sum + item.quantity, 0);
            return { ...p, stock };
        });
    }, [products, inventory, watchBranchId]);

    const availableProducts = useMemo(() => {
        if (!productsWithInventory) return [];
        return productsWithInventory
            .filter(p => {
                const searchTerm = productSearch.toLowerCase();
                if (watchItems.some(item => item.productId === p.id)) return false;
                if (!searchTerm) return true;
                return p.name.toLowerCase().includes(searchTerm) ||
                    p.sku.toLowerCase().includes(searchTerm) ||
                    (p.activeIngredient && p.activeIngredient.toLowerCase().includes(searchTerm));
            })
            .sort((a, b) => {
                if (a.stock > 0 && b.stock <= 0) return -1;
                if (b.stock > 0 && a.stock <= 0) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [productsWithInventory, productSearch, watchItems]);

    const recommendations = useMemo(() => {
        if (!selectedClient) return [];
        const recs = getRecommendations(selectedClient, productsWithInventory);
        return recs.filter(rec => !watchItems.some(item => item.productId === rec.product.id) && rec.product.stock > 0);
    }, [selectedClient, productsWithInventory, watchItems]);

    const handleAddProduct = (product: ProductWithInventory) => {
        if (product.stock <= 0) {
            toast({ title: "Sin stock", variant: "destructive" });
            return;
        }
        append({
            productId: product.id!,
            productName: product.name,
            quantity: 1,
            price: product.price,
            stock: product.stock,
            cost: product.cost || 0,
            sku: product.sku,
        });
        setProductSearch('');
    };

    useEffect(() => {
        const client = clients.find(c => c.id === watchClientId);
        setSelectedClient(client || null);
        if (watchClientId === PUBLIC_GENERAL_ID || !client?.creditLimit) {
            setValue('paymentMethod', 'Efectivo');
        }
    }, [watchClientId, clients, setValue]);

    const onSubmit = (data: SaleFormValues) => {
        const client = clients.find(c => c.id === data.clientId);
        const clientName = data.clientId === 'general-public' ? 'Público en General' : client?.name || 'N/A';
        
        const saleData = { ...data, clientName, total: totalAmount, items: watchItems, subtotal };
        onSaleCreated(saleData as any);
        setIsDialogOpen(false);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isDialogOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setIsDialogOpen(false);
                }
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault();
                    form.handleSubmit(onSubmit)();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDialogOpen, form, onSubmit]);

    const clientOptions = useMemo(() => [
        { value: PUBLIC_GENERAL_ID, label: "Público General" },
        ...clients.map(c => ({ value: c.id!, label: c.name }))
    ], [clients]);

    const handleOpenDialog = () => {
        form.reset({
            branchId: '',
            clientId: PUBLIC_GENERAL_ID,
            items: [],
            paymentMethod: 'Efectivo',
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Ventas</h2>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/crm/clients')}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </Button>
                <Button variant="outline" onClick={onDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) form.reset(); setIsDialogOpen(open); }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenDialog}>
                            <PlusCircle className="mr-2" /> Nueva Venta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Registrar Nueva Venta</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                                    <FormField control={control} name="branchId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sucursal</FormLabel>
                                            <Select onValueChange={v => { field.onChange(v); setValue('items', []); }} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {branches.map(b => <SelectItem key={b.id} value={b.id!}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Cliente</FormLabel>
                                                <div className="flex gap-2">
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Seleccionar..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {clientOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Dialog open={isClientSearchOpen} onOpenChange={setIsClientSearchOpen}>
                                                        <DialogTrigger asChild>
                                                             <Button variant="outline" size="icon">
                                                                <Search className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="p-0">
                                                            <Command>
                                                                <CommandInput placeholder="Buscar cliente..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {clientOptions.map((option) => (
                                                                            <CommandItem
                                                                                key={option.value}
                                                                                value={option.label}
                                                                                onSelect={() => {
                                                                                    field.onChange(option.value);
                                                                                    setIsClientSearchOpen(false);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        option.value === field.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {option.label}
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
                                    <Card className="bg-muted/50">
                                        <CardContent className="p-3">
                                            {isPublicGeneral && (
                                                <div className="text-sm text-muted-foreground flex items-center justify-center h-full gap-2">
                                                    <User className="w-4 h-4" /> Venta a Público General
                                                </div>
                                            )}
                                            {selectedClient && (
                                                <div className="space-y-1">
                                                    <div className='text-xs text-muted-foreground'>
                                                        Razón Social: <span className='font-semibold text-foreground'>{selectedClient.name || 'N/A'}</span>
                                                    </div>
                                                    <div className='text-xs text-muted-foreground'>
                                                        RFC: <span className='font-semibold text-foreground'>{selectedClient.rfc || 'N/A'}</span>
                                                    </div>
                                                    {selectedClient.creditLimit && (
                                                        <div>
                                                            <Label className="text-xs">Crédito</Label>
                                                            <Progress value={creditUsagePercentage} className="h-2 mt-1" />
                                                            <div className="flex justify-between text-xs mt-1">
                                                                <span>Usado: {formatCurrency(creditUsed)}</span>
                                                                <span className="font-bold text-green-600">Disp: {formatCurrency(availableCredit)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0">
                                    <div className="flex flex-col gap-4">
                                        <Input 
                                            placeholder="Buscar por SKU, nombre o ingrediente activo..." 
                                            onChange={e => setProductSearch(e.target.value)} 
                                            disabled={!watchBranchId} 
                                        />
                                        {recommendations.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                                                    <Sparkles className="w-4 h-4" />Recomendaciones
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {recommendations.map(r => (
                                                        <Button 
                                                            key={r.product.id} 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-auto" 
                                                            onClick={() => handleAddProduct(r.product)}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span>{r.product.name}</span>
                                                                <span className="text-xs text-muted-foreground">{r.reason}</span>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <Card className="flex-1">
                                            <CardContent className="p-0">
                                                <ScrollArea className="h-full">
                                                    <Table>
                                                        <TableHeader className="sticky top-0 bg-muted">
                                                            <TableRow>
                                                                <TableHead>Producto</TableHead>
                                                                <TableHead>Stock</TableHead>
                                                                <TableHead>Precio</TableHead>
                                                                <TableHead></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {availableProducts.map(p => (
                                                                <TableRow key={p.id}>
                                                                    <TableCell className="font-medium text-xs">{p.name}</TableCell>
                                                                    <TableCell>{p.stock}</TableCell>
                                                                    <TableCell className="text-xs font-semibold">{formatCurrency(p.price)}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button 
                                                                            type="button" 
                                                                            size="sm" 
                                                                            onClick={() => handleAddProduct(p)} 
                                                                            disabled={p.stock <= 0}
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <Card className="flex flex-col">
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>Detalle de Venta</CardTitle>
                                            <FormField control={control} name="paymentMethod" render={({ field }) => (
                                                <FormItem className="w-[150px]">
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                                                            <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                                                            <SelectItem value="Credito" disabled={isPublicGeneral || !selectedClient?.creditLimit}>Crédito</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </CardHeader>
                                        <CardContent className="flex-1 p-0 overflow-auto">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-muted">
                                                    <TableRow>
                                                        <TableHead>Producto</TableHead>
                                                        <TableHead>Cant.</TableHead>
                                                        <TableHead>Subtotal</TableHead>
                                                        <TableHead>IVA</TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fields.map((item, index) => {
                                                        const product = products.find(p => p.id === watchItems[index]?.productId);
                                                        const totalItemPrice = (watchItems[index]?.price || 0) * (watchItems[index]?.quantity || 0);
                                                        
                                                        const isZeroRate = product?.objetoImp === '04' || (product && ZERO_RATE_CATEGORIES.includes(product.category.toUpperCase()));
                                                        const itemIvaRate = isZeroRate ? 0 : (product?.ivaRate ?? IVA_RATE);
                                                        
                                                        const itemSubtotal = totalItemPrice;
                                                        const itemIva = itemSubtotal * itemIvaRate;

                                                        return (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium text-xs">{watchItems[index]?.productName}</TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={control}
                                                                    name={`items.${index}.quantity`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input type="number" className="w-20 h-8" {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right text-xs">
                                                                {formatCurrency(itemSubtotal)}
                                                            </TableCell>
                                                             <TableCell className="text-right text-xs text-muted-foreground">
                                                                {formatCurrency(itemIva)}
                                                            </TableCell>
                                                            <TableCell className="p-1 text-right">
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-destructive hover:text-destructive" 
                                                                    onClick={() => remove(index)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="pt-4 border-t flex items-center justify-end gap-6">
                                     <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
                                        <p className="text-sm text-muted-foreground">IVA: {formatCurrency(totalIva)}</p>
                                        <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                                    </div>
                                    <Button 
                                        type="submit" 
                                        size="lg" 
                                        disabled={form.formState.isSubmitting || fields.length === 0 || creditError || hasInventoryError}
                                    >
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Guardar Venta
                                    </Button>
                                </div>
                                {creditError && (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />Crédito insuficiente para esta venta.
                                    </p>
                                )}
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTimbrading, setIsTimbrading] = useState<string | null>(null);
    const [viewingTicket, setViewingTicket] = useState<Sale | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const salesCollection = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'sales'), orderBy('date', 'desc')) : null, [firestore, user]);
    const { data: fetchedSales, isLoading: salesLoading } = useCollection<Sale>(salesCollection);

    const productsCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'products') : null, [firestore, user]);
    const { data: fetchedProducts, isLoading: productsLoading } = useCollection<Product>(productsCollection);

    const clientsCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'clients') : null, [firestore, user]);
    const { data: fetchedClients, isLoading: clientsLoading } = useCollection<Client>(clientsCollection);

    const inventoryCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'inventory') : null, [firestore, user]);
    const { data: fetchedInventory, isLoading: inventoryLoading } = useCollection<InventoryItem>(inventoryCollection);
    
    const branchesCollection = useMemoFirebase(() => firestore && user ? collection(firestore, 'branches') : null, [firestore, user]);
    const { data: fetchedBranches, isLoading: branchesLoading } = useCollection<Branch>(branchesCollection);

    useEffect(() => {
        if (fetchedSales) {
            setSales(fetchedSales.map(s => {
                let dateObject: Date;
                if (s.date instanceof Timestamp) {
                    dateObject = s.date.toDate();
                } else if (typeof s.date === 'string') {
                    dateObject = new Date(s.date);
                } else {
                    dateObject = new Date();
                }
                return { ...s, date: dateObject };
            }));
        }
    }, [fetchedSales]);

    useEffect(() => {
        if(fetchedProducts) setProducts(fetchedProducts);
    }, [fetchedProducts]);

    useEffect(() => {
        if(fetchedClients) setClients(fetchedClients);
    }, [fetchedClients]);

    useEffect(() => {
        if(fetchedInventory) setInventory(fetchedInventory);
    }, [fetchedInventory]);

     useEffect(() => {
        if(fetchedBranches) setBranches(fetchedBranches);
    }, [fetchedBranches]);

    useEffect(() => {
        setLoading(salesLoading || productsLoading || clientsLoading || inventoryLoading || branchesLoading);
    }, [salesLoading, productsLoading, clientsLoading, inventoryLoading, branchesLoading]);


    const handleDownloadPDF = async () => {
        const doc = new jsPDF();
        
        try {
            const logoResponse = await fetch('/logo.png');
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(logoBlob);
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
            });
            doc.addImage(logoBase64, 'PNG', 15, 12, 40, 15);
        } catch (error) {
            console.error("No se pudo cargar el logo para el PDF", error);
        }

        doc.setFontSize(18);
        doc.text("Reporte de Ventas", 105, 30, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });
        
        let totalGeneral = 0;
        autoTable(doc, {
            startY: 50,
            head: [['Fecha', 'Cliente', 'Total', 'Estado Fiscal']],
            body: sales.map(sale => {
                totalGeneral += sale.total;
                return [
                    sale.date.toLocaleDateString(),
                    sale.clientName,
                    formatCurrency(sale.total),
                    'Pendiente'
                ]
            }),
            headStyles: { fillColor: '#2E7D32' },
            didDrawPage: (data) => {
              const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 0;
              doc.setFontSize(10);
              doc.text('Página ' + data.pageNumber + ' de ' + pageCount, data.settings.margin.left!, doc.internal.pageSize.height - 10);
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Valor Total General:', 14, finalY);
        doc.text(formatCurrency(totalGeneral), 200, finalY, { align: 'right' });
        
        doc.save('reporte_ventas.pdf');
        toast({ title: "Reporte de ventas descargado." });
    };

    const handleAddSale = (saleData: any) => {
        runTransaction(firestore, async (transaction) => {
            const saleRef = doc(collection(firestore, 'sales'));
            let totalCost = 0;
            
            for (const item of saleData.items) {
                const inventoryQuery = query(
                    collection(firestore, 'inventory'),
                    where('sku', '==', item.sku),
                    where('branchId', '==', saleData.branchId)
                );
                
                const inventorySnap = await getDocs(inventoryQuery);
                let remainingQuantityToDeduct = item.quantity;
                
                if (inventorySnap.empty && remainingQuantityToDeduct > 0) {
                    throw new Error(`No hay stock para ${item.productName} en esta sucursal.`);
                }
                
                for (const inventoryDoc of inventorySnap.docs) {
                    if (remainingQuantityToDeduct <= 0) break;
                    
                    const lotData = inventoryDoc.data();
                    const availableInLot = lotData.quantity;
                    const quantityToDeductFromLot = Math.min(remainingQuantityToDeduct, availableInLot);
                    
                    transaction.update(inventoryDoc.ref, {
                        quantity: availableInLot - quantityToDeductFromLot
                    });
                    
                    totalCost += quantityToDeductFromLot * (lotData.unitPrice || 0);
                    remainingQuantityToDeduct -= quantityToDeductFromLot;
                }

                if (remainingQuantityToDeduct > 0) {
                     throw new Error(`Stock insuficiente para ${item.productName}. Faltan ${remainingQuantityToDeduct} unidades.`);
                }
            }

            const saleToSave: Omit<Sale, 'id' | 'date'> & { date: Timestamp } = { 
                ...saleData, 
                date: Timestamp.fromDate(new Date()),
                totalCost,
                margin: saleData.total - totalCost
            };
            transaction.set(saleRef, saleToSave);
            return { id: saleRef.id, ...saleToSave, date: new Date() };

        }).then((newSale) => {
            toast({ title: 'Venta registrada con éxito' });
            if (newSale) {
                setSales(prev => [newSale, ...prev]);
                handleSaleCreated(newSale);
            }
        }).catch((error) => {
            console.error("Error en transacción de venta: ", error);
            toast({ title: 'Error en la venta', description: error.message, variant: 'destructive' });
        });
    };
    
    const handleSaleCreated = (newSale: Sale) => {
        setViewingTicket(newSale);
    };

    const promptDeleteSale = (sale: Sale) => {
        setSaleToDelete(sale);
        setIsAlertOpen(true);
    };

    const handleDeleteSale = async () => {
        if (!saleToDelete) return;

        const saleRef = doc(firestore, 'sales', saleToDelete.id);
        
        try {
            await deleteDoc(saleRef);
            toast({
                title: "Venta eliminada",
                description: `La venta con folio ${saleToDelete.id.substring(0,8)} ha sido eliminada.`,
                variant: "destructive"
            });
            setSales(prev => prev.filter(s => s.id !== saleToDelete.id));
        } catch (error: any) {
            console.error("Error deleting sale:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: saleRef.path,
                operation: 'delete',
            }));
            toast({
                title: "Error al eliminar",
                description: "No se pudo eliminar la venta. Verifica tus permisos.",
                variant: "destructive"
            });
        } finally {
            setIsAlertOpen(false);
            setSaleToDelete(null);
        }
    };


    return (
        <div className="flex flex-col gap-6">
            {viewingTicket && <TicketPrinter sale={viewingTicket} products={products || []} onClose={() => setViewingTicket(null)} />}
             <Card>
                <CardHeader>
                    <SalesForm 
                        products={products || []}
                        clients={clients || []}
                        inventory={inventory || []}
                        onSaleCreated={handleAddSale}
                        branches={branches || []}
                        onDownloadPDF={handleDownloadPDF}
                    />
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
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Sucursal</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.date.toLocaleDateString()}</TableCell>
                                        <TableCell>{sale.clientName}</TableCell>
                                        <TableCell>{formatCurrency(sale.total)}</TableCell>
                                        <TableCell>{sale.paymentMethod}</TableCell>
                                        <TableCell>{branches.find(b => b.id === sale.branchId)?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setViewingTicket(sale)}>
                                                        <FileText className="mr-2 h-4 w-4"/>
                                                        <span>Ver Ticket</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => promptDeleteSale(sale)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                        <span>Eliminar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta venta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible y eliminará permanentemente el registro de la venta. Los movimientos de inventario no se revertirán automáticamente.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSale} className="bg-destructive hover:bg-destructive/90">
                        Sí, eliminar venta
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
