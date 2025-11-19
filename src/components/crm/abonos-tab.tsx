'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client, Supplier, Sale } from '@/lib/types';
import type { Payment } from '@/docs/backend.json';
import { PlusCircle, Loader2, CalendarIcon, Download } from 'lucide-react';
import { collection, Timestamp, query, where, runTransaction } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const clientPaymentSchema = z.object({
  clientId: z.string().min(1, 'Cliente es requerido'),
  saleId: z.string().optional(),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  date: z.date({ required_error: 'La fecha es requerida' }),
  note: z.string().optional(),
});

const supplierPaymentSchema = z.object({
  supplierId: z.string().min(1, 'Proveedor es requerido'),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  date: z.date({ required_error: 'La fecha es requerida' }),
  note: z.string().optional(),
});

export function AbonosTab() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: clients, isLoading: loadingClients } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
  const { data: suppliers, isLoading: loadingSuppliers } = useCollection<Supplier>(useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]));
  const { data: sales, isLoading: loadingSales } = useCollection<Sale>(useMemoFirebase(() => firestore ? query(collection(firestore, 'sales'), where('paymentMethod', '==', 'Credito')) : null, [firestore]));
  const { data: clientPayments, isLoading: loadingClientPayments } = useCollection<Payment>(useMemoFirebase(() => firestore ? query(collection(firestore, 'payments'), where('type', '==', 'client')) : null, [firestore]));
  const { data: supplierPayments, isLoading: loadingSupplierPayments } = useCollection<Payment>(useMemoFirebase(() => firestore ? query(collection(firestore, 'payments'), where('type', '==', 'supplier')) : null, [firestore]));

  const loading = loadingClients || loadingSuppliers || loadingSales || loadingClientPayments || loadingSupplierPayments;

  const clientForm = useForm<z.infer<typeof clientPaymentSchema>>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: { clientId: '', saleId: '', amount: 0, date: new Date(), note: '' },
  });

  const supplierForm = useForm<z.infer<typeof supplierPaymentSchema>>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: { supplierId: '', amount: 0, date: new Date(), note: '' },
  });

  const watchedClientId = useWatch({ control: clientForm.control, name: 'clientId' });

  const onClientSubmit = async (values: z.infer<typeof clientPaymentSchema>) => {
    const client = clients?.find(c => c.id === values.clientId);
    if (!client || !firestore) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const clientRef = doc(firestore, 'clients', values.clientId);
        const clientDoc = await transaction.get(clientRef);
        if (!clientDoc.exists()) throw new Error("El cliente no existe.");

        const currentCreditUsed = clientDoc.data().creditUsed || 0;
        const newCreditUsed = currentCreditUsed - values.amount;

        if (newCreditUsed < 0) {
          toast({ title: 'Advertencia', description: 'El abono es mayor al saldo pendiente. El saldo se establecerá en $0.00.' });
        }
        transaction.update(clientRef, { creditUsed: Math.max(0, newCreditUsed) });

        const paymentRef = doc(collection(firestore, 'payments'));
        const paymentData = {
          ...values,
          id: paymentRef.id,
          type: 'client',
          client: client.name,
          date: format(values.date, 'yyyy-MM-dd'),
        };
        transaction.set(paymentRef, paymentData);
      });
      toast({ title: 'Abono Aplicado' });
      setIsClientDialogOpen(false);
      clientForm.reset();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo registrar el abono.', variant: 'destructive' });
    }
  };
  
    const onSupplierSubmit = (values: z.infer<typeof supplierPaymentSchema>) => {
        // Lógica para abono a proveedor
    };

  const clientsWithCredit = useMemo(() => clients?.filter(c => c.hasCredit && (c.creditUsed || 0) > 0) || [], [clients]);
  
  const salesForSelectedClient = useMemo(() => {
    if (!watchedClientId || !sales) return [];
    
    const paymentsBySaleId = clientPayments?.reduce((acc, payment) => {
      if (payment.saleId) {
        if (!acc[payment.saleId]) acc[payment.saleId] = 0;
        acc[payment.saleId] += payment.amount;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    return sales
      .filter(sale => sale.clientId === watchedClientId)
      .map(sale => ({
        ...sale,
        balance: sale.total - (paymentsBySaleId[sale.id!] || 0)
      }))
      .filter(sale => sale.balance > 0.01);
  }, [watchedClientId, sales, clientPayments]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="clients" className="mt-0">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">Abonos de Clientes</TabsTrigger>
            <TabsTrigger value="suppliers">Abonos a Proveedores</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Historial de Abonos de Clientes</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled={isExporting}>
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Exportar
                            </Button>
                            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                                <DialogTrigger asChild><Button><PlusCircle className="mr-2" /> Registrar Abono</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Registrar Abono de Cliente</DialogTitle></DialogHeader>
                                    <Form {...clientForm}>
                                        <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
                                            <FormField control={clientForm.control} name="clientId" render={({ field }) => (
                                                <FormItem><FormLabel>Cliente con Crédito</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger></FormControl><SelectContent>{clientsWithCredit.map(c => <SelectItem key={c.id} value={c.id!}>{c.name} (Saldo: {formatCurrency(c.creditUsed || 0)})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                            )} />
                                            {salesForSelectedClient.length > 0 && (
                                                <FormField control={clientForm.control} name="saleId" render={({ field }) => (
                                                    <FormItem><FormLabel>Venta a abonar (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Aplicar a una venta específica..." /></SelectTrigger></FormControl><SelectContent>{salesForSelectedClient.map(sale => <SelectItem key={sale.id} value={sale.id!}>Folio: {sale.id?.substring(0, 7)} - Saldo: {formatCurrency(sale.balance)}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                                )} />
                                            )}
                                            <FormField control={clientForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={clientForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Seleccionar</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                            <FormField control={clientForm.control} name="note" render={({ field }) => (<FormItem><FormLabel>Nota</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <Button type="submit" disabled={clientForm.formState.isSubmitting}>{clientForm.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />} Guardar</Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Nota</TableHead><TableHead>Venta ID</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                        <TableBody>{(clientPayments || []).map(p => <TableRow key={p.id}><TableCell>{p.date ? format(new Date(p.date), 'dd/MM/yyyy') : ''}</TableCell><TableCell>{p.client}</TableCell><TableCell>{p.notes}</TableCell><TableCell className="font-mono text-xs">{p.saleId ? `...${p.saleId.slice(-5)}` : 'N/A'}</TableCell><TableCell className="text-right">{formatCurrency(p.amount)}</TableCell></TableRow>)}</TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
           <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Historial de Abonos a Proveedores</CardTitle>
                        <Button disabled><PlusCircle className="mr-2" />Registrar Abono</Button>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-8 text-muted-foreground">
                        Funcionalidad próximamente.
                    </div>
                </CardContent>
           </Card>
        </TabsContent>
    </Tabs>
  );
}
