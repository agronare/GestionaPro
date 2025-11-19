'use client';
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { InvoiceList } from '@/components/invoicing/invoice-list';
import { CreateInvoiceDialog } from '@/components/invoicing/create-invoice-dialog';
import type { Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collectionGroup, doc } from 'firebase/firestore';


export default function InvoicingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const invoicesCollectionGroup = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collectionGroup(firestore, 'invoices');
  }, [firestore, user]);
  const { data: invoices, isLoading } = useCollection<Invoice & { clientId: string }>(invoicesCollectionGroup);

  const handleAddInvoice = (
    newInvoiceData: Omit<Invoice, 'id' | 'issueDate' | 'status' | 'invoiceNumber'>
  ) => {
    // This dialog is a bit of a legacy component now.
    // The real invoice creation for credit sales happens in /crm/credits
    // We can leave this as a mock/placeholder for direct invoicing if needed,
    // but it won't be connected to a client.
     toast({
      title: "Función no implementada",
      description: `La creación de facturas directas se realiza desde el módulo de Créditos en CRM.`,
    });
  };

  const handleAction = (action: 'view' | 'download', invoiceId: string) => {
    toast({
      title: "Función no implementada",
      description: `La acción de ${action === 'view' ? 'ver' : 'descargar'} estará disponible próximamente.`,
    });
  };
  
  const promptCancelInvoice = (invoice: Invoice) => {
    setInvoiceToCancel(invoice);
    setIsAlertOpen(true);
  }

  const handleCancelInvoice = () => {
    if (!firestore || !invoiceToCancel || !('clientId' in invoiceToCancel)) return;
    const invoiceDocRef = doc(firestore, 'clients', (invoiceToCancel as any).clientId, 'invoices', invoiceToCancel.id);
    updateDocumentNonBlocking(invoiceDocRef, { status: 'Cancelled' });
    toast({
      title: "Factura Cancelada",
      description: "La factura ha sido marcada como cancelada.",
      variant: "destructive"
    });
    setInvoiceToCancel(null);
    setIsAlertOpen(false);
  };


  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Facturación
        </h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Factura
        </Button>
      </div>
      <div className="p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
        <InvoiceList 
            invoices={invoices} 
            isLoading={isLoading}
            onAction={handleAction}
            onCancel={promptCancelInvoice}
        />
      </div>
      <CreateInvoiceDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddInvoice={handleAddInvoice}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. La factura será marcada como cancelada.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToCancel(null)}>No, mantener factura</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvoice} className="bg-destructive hover:bg-destructive/90">Sí, cancelar factura</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </div>
  );
}
