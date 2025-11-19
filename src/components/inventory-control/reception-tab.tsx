'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Truck, FileCheck2, Save, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PurchaseOrder } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Product } from '@/lib/types';
import Link from 'next/link';

type OrderProduct = {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  receivedQuantity: number | null;
};

export function ReceptionTab() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const firestore = useFirestore();
  const { toast } = useToast();

  const purchaseDocRef = useMemoFirebase(() => orderId ? doc(firestore, 'purchases', orderId) : null, [firestore, orderId]);
  const { data: purchase, isLoading: isLoadingPurchase } = useDoc<PurchaseOrder>(purchaseDocRef);

  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  
  useEffect(() => {
    if (purchase?.items) {
      setOrderProducts(purchase.items.map(item => ({ 
          ...item,
          productName: item.productName || item.productId,
          receivedQuantity: item.quantity 
      })));
    }
  }, [purchase]);

  const handleReceptionChange = (productId: string, count: number) => {
    setOrderProducts(prev => prev.map(p =>
      p.productId === productId ? { ...p, receivedQuantity: isNaN(count) ? null : count } : p
    ));
  };
  
  const calculateVariance = (expected: number, received: number | null) => {
    if (received === null) return null;
    return received - expected;
  };
  
  const handleConfirmReception = async () => {
    if (!orderId || !orderProducts.length || !purchase) return;

    const inventoryCollectionRef = collection(firestore, 'inventory');

    for (const product of orderProducts) {
      if (product.receivedQuantity && product.receivedQuantity > 0) {
        const lotId = `${product.productId}-${Date.now()}`;
        
        const newInventoryItem = {
          id: lotId,
          productName: product.productName || 'N/A',
          sku: product.productId,
          lot: `LOTE-${Date.now().toString().slice(-6)}`,
          quantity: product.receivedQuantity,
          unitPrice: product.cost,
          entryDate: format(new Date(), 'dd/MM/yyyy'),
          branchId: purchase.branchId || 'matriz'
        };

        const inventoryDocRef = doc(inventoryCollectionRef, lotId);
        await setDocumentNonBlocking(inventoryDocRef, newInventoryItem, { merge: true });
      }
    }
    
    toast({
        title: "Recepción Confirmada",
        description: "El inventario ha sido actualizado con los productos recibidos."
    });
  }

  if (isLoadingPurchase) {
    return <Card><CardContent className='p-6'><Skeleton className="h-64 w-full" /></CardContent></Card>
  }

  if (!orderId || !purchase) {
    return (
        <Card>
            <CardContent className="p-6">
                <Alert variant="default" className="border-blue-500/50 text-blue-800 dark:border-blue-500/50 [&>svg]:text-blue-800 dark:[&>svg]:text-blue-400 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Sin Orden de Compra Seleccionada</AlertTitle>
                    <AlertDescription>
                        Para validar una recepción, accede a esta página desde el folio de una compra en el módulo de <Link href="/erp/purchases" className='font-bold underline'>Compras</Link>.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className='flex items-center gap-4'>
            <Truck className='h-6 w-6 text-muted-foreground' />
            <div>
              <h2 className="text-lg font-semibold">Recepción de Orden de Compra</h2>
              <p className="text-sm text-muted-foreground">
                Folio: <span className='font-bold text-foreground'>{orderId.substring(0,7)}</span> | Proveedor: <span className='font-bold text-foreground'>{purchase?.supplierName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <FileWarning className="mr-2 h-4 w-4" />
              Guardar Parcial
            </Button>
            <Button onClick={handleConfirmReception}>
              <FileCheck2 className="mr-2 h-4 w-4" />
              Confirmar Recepción
            </Button>
          </div>
        </div>
        <Separator />
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-2/5">Producto</TableHead>
                <TableHead className='text-center'>Cant. Esperada</TableHead>
                <TableHead className='text-center w-36'>Cant. Recibida</TableHead>
                <TableHead className='text-center'>Varianza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderProducts.map(item => {
                const variance = calculateVariance(item.quantity, item.receivedQuantity);
                return (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        className="w-28 mx-auto text-center"
                        value={item.receivedQuantity === null ? '' : item.receivedQuantity}
                        onChange={e => handleReceptionChange(item.productId, parseInt(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className={cn(
                        "text-center font-bold",
                        variance === null ? "" : variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {variance === null ? '-' : variance > 0 ? `+${variance}` : variance}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
