'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Search, Trash2, User, Plus } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Client } from '@/app/crm/clients/page';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { createNotification } from '@/services/notification-service';
import type { InventoryItem } from '@/app/erp/inventory/page';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import type { Branch } from '@/app/hr/branches/page';
import type { Product, ProductWithInventory } from '@/lib/types';


type AddSaleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddSale: (branchId: string, data: any) => void;
};

const saleSchema = z.object({
    branch: z.string().min(1, 'La sucursal es obligatoria.'),
    clientId: z.string(), 
    paymentMethod: z.string().min(1),
    discount: z.coerce.number().optional(),
});

export type CartItem = Product & { quantity: number; stock: number; };

export function AddSaleDialog({
  isOpen,
  onOpenChange,
  onAddSale,
}: AddSaleDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clientsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'clients');
  }, [firestore, user]);
  const { data: clients } = useCollection<Client>(clientsCollection);
  
  const productsCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'products');
  }, [firestore, user]);
  const { data: products } = useCollection<Product>(productsCollection);

  const inventoryCollection = useMemoFirebase(() => {
      if (!user) return null;
      return collection(firestore, 'inventory');
  }, [firestore, user]);
  const { data: inventory } = useCollection<InventoryItem>(inventoryCollection);
  
  const branchesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'branches');
  }, [firestore, user]);
  const { data: branches, isLoading: areBranchesLoading } = useCollection<Branch>(branchesCollection);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      branch: '',
      paymentMethod: 'Efectivo',
      clientId: 'general-public',
      discount: 0,
    },
  });
  
  const selectedBranchId = form.watch('branch');
  
 const getProductStock = (productId: string, currentInventory: InventoryItem[] | null): number => {
    if (!currentInventory || !selectedBranchId) return 0;
    const product = products?.find(p => p.id === productId);
    if (!product) return 0;
    
    return currentInventory
        .filter(item => item.sku === product.sku && item.branchId === selectedBranchId)
        .reduce((sum, item) => sum + item.quantity, 0);
  }

  useEffect(() => {
    if (selectedBranchId) {
        searchInputRef.current?.focus();
    }
  }, [selectedBranchId]);
  
 const getTaxRate = (product: Product) => {
    switch (product.objetoImp) {
      case '02': // Sí objeto de impuesto
        // Devuelve la tasa de IVA del producto, o 0 si no está definida.
        return product.ivaRate ?? 0; 
      case '04': // Sí objeto del impuesto y no causa impuesto (Tasa 0%)
        return 0;
      case '01': // No objeto de impuesto.
      case '03': // Sí objeto del impuesto y no obligado al desglose.
      default:
        return 0;
    }
  }

  useEffect(() => {
    const discount = form.getValues('discount') || 0;
    const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartIva = cart.reduce((acc, item) => {
        const itemSubtotal = item.price * item.quantity;
        const taxRate = getTaxRate(item);
        return acc + (itemSubtotal * taxRate);
    }, 0);
    
    const discountedSubtotal = cartSubtotal - discount;
    const currentTotal = discountedSubtotal + cartIva;

    setSubtotal(cartSubtotal);
    setIva(cartIva);
    setTotal(currentTotal);
  }, [cart, form.watch('discount')]);

  const addToCart = (product: ProductWithInventory) => {
    if (product.stock <= 0) {
      toast({
        title: 'Sin Stock',
        description: `El producto ${product.name} no tiene stock disponible en esta sucursal.`,
        variant: 'destructive',
      });
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
       if (existingItem.quantity >= product.stock) {
        toast({
            title: 'Stock Insuficiente',
            description: `No puedes agregar más de ${product.stock} unidades para ${product.name}.`,
            variant: 'destructive',
        });
        return;
      }
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart(prevCart => [...prevCart, { ...product, quantity: 1, stock: product.stock }]);
    }
  };

  const updateCartItemQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
        if (item.id === productId) {
            const newQuantity = item.quantity + change;
            const stock = getProductStock(item.id!, inventory);
            if (newQuantity > stock) {
                 toast({
                    title: 'Stock Insuficiente',
                    description: `Solo hay ${stock} unidades disponibles para ${item.name}.`,
                    variant: 'destructive',
                });
                return { ...item, quantity: stock };
            }
            return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
    }).filter(item => item.quantity > 0));
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const onSubmit = (data: z.infer<typeof saleSchema>) => {
    if (cart.length === 0) {
        toast({ title: 'Carrito vacío', description: 'Debes agregar al menos un producto.', variant: 'destructive'});
        return;
    }
    const client = clients?.find(c => c.id === data.clientId);
    const clientName = data.clientId === 'general-public' ? 'Público en General' : client?.name || 'N/A';
    
    const saleData = { ...data, clientName, total, cart, subtotal };
    onAddSale(data.branch, saleData);

    form.reset();
    setCart([]);
    onOpenChange(false);
  };
  
  const resetDialog = () => {
    form.reset();
    setCart([]);
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        resetDialog();
    }
    onOpenChange(open);
  }

  const filteredProducts = useMemo((): ProductWithInventory[] => {
    if (!products || !selectedBranchId) return [];
    
    const productsWithStock = products.map(p => ({
        ...p,
        stock: getProductStock(p.id!, inventory)
    }));

    return productsWithStock.filter(p => {
        const hasStock = p.stock > 0;
        const matchesSearch = searchTerm ? 
                              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.activeIngredient && p.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()))
                              : true;
        return hasStock && matchesSearch;
    });
  }, [products, searchTerm, selectedBranchId, inventory]);


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className='p-6 pb-4 border-b'>
          <DialogTitle className='text-xl'>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='flex-1 grid md:grid-cols-2 gap-x-6 overflow-hidden'>
                {/* Left Column */}
                <div className='flex flex-col gap-4 overflow-hidden pl-6 pt-2 pb-6'>
                    <div className="grid grid-cols-2 gap-4">
                       <FormField control={form.control} name="branch" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sucursal</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={areBranchesLoading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={areBranchesLoading ? "Cargando..." : "Seleccionar..."}/>
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
                        )}/>
                         <div className='flex items-end gap-2'>
                             <FormField control={form.control} name="clientId" render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="general-public">Público en General</SelectItem>
                                            {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Button type="button" variant="outline" size="icon" onClick={() => form.setValue('clientId', 'general-public')}>
                                <User className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            ref={searchInputRef}
                            placeholder="Buscar por SKU, nombre o ingrediente activo..." 
                            className="pl-9" 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            disabled={!selectedBranchId}
                        />
                    </div>
                     <div className='flex-1 rounded-lg border overflow-hidden'>
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className='bg-muted/50 sticky top-0 z-10'>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className='w-24 text-center'>Stock</TableHead>
                                        <TableHead className='w-[50px]'></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {!selectedBranchId ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className='h-48 text-center text-muted-foreground'>
                                            Selecciona una sucursal para ver los productos disponibles.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProducts?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className='h-48 text-center text-muted-foreground'>
                                            No hay productos con stock en esta sucursal.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProducts?.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className='font-medium'>{p.name}</TableCell>
                                        <TableCell className='text-center text-muted-foreground font-medium'>{p.stock}</TableCell>
                                        <TableCell className='w-[50px]'>
                                            <Button type="button" size="icon" className='h-8 w-8' onClick={() => addToCart(p)}>
                                                <Plus className='h-4 w-4' />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>

                {/* Right Column */}
                <div className='flex flex-col gap-4 pr-6 pt-2 pb-6 border-l bg-muted/20'>
                   <div className='px-4'>
                        <h3 className='font-semibold'>Detalle de Venta</h3>
                   </div>
                    <div className='flex-1 rounded-lg border bg-background mx-4 overflow-hidden'>
                       <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className='bg-muted/50 sticky top-0 z-10'>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className='w-28 text-center'>Cant.</TableHead>
                                        <TableHead className='w-32 text-right'>Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className='h-48 text-center text-muted-foreground'>
                                                Agrega productos a la venta
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cart.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className='font-medium'>{item.name}</TableCell>
                                                <TableCell className='w-28'>
                                                    <div className='flex items-center justify-center gap-1'>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id!)}><Trash2 className="h-3 w-3"/></Button>
                                                        <Input type="number" value={item.quantity} className="h-8 w-12 text-center p-0 border-none bg-transparent focus-visible:ring-0" readOnly/>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartItemQuantity(item.id!, 1)}><Plus className="h-4 w-4"/></Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className='w-32 text-right font-medium'>${(item.quantity * item.price).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                    <div className='px-4 mt-auto space-y-4'>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="discount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descuento (MXN)</FormLabel>
                                    <Input type="number" placeholder="0.00" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Método de Pago</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                                            <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                                            <SelectItem value="Transferencia">Transferencia</SelectItem>
                                            <SelectItem value="Crédito">Crédito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                         <div className="p-4 border-t bg-background flex justify-end">
                            <div className='flex items-end gap-8'>
                                <div className='flex flex-col items-end gap-1 text-sm text-right'>
                                    <p>Subtotal: <span className="font-medium w-28 inline-block">MXN {subtotal.toFixed(2)}</span></p>
                                    <p>Descuento: <span className="font-medium w-28 inline-block text-red-600">- MXN {(form.getValues('discount') || 0).toFixed(2)}</span></p>
                                    <p>IVA: <span className="font-medium w-28 inline-block">MXN {iva.toFixed(2)}</span></p>
                                </div>
                                <div className='flex items-center gap-4'>
                                    <p className="text-2xl font-bold text-primary">
                                        <span className='text-base font-normal text-muted-foreground mr-2'>TOTAL:</span> 
                                        MXN {total.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" size="lg" className="w-full" disabled={cart.length === 0}>Guardar Venta</Button>
                    </div>
                </div>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
