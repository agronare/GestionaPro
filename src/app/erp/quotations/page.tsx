
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from '@/hooks/use-toast';
import { Quote, QuoteStatus, Supplier, Product } from '@/lib/types';
import { Edit, MoreHorizontal, CheckCircle, XCircle, Download, Filter, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, Timestamp, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';
import { AddQuotationDialog } from '@/components/erp/add-quotation-dialog';

const STATUS_OPTIONS: (QuoteStatus | 'all')[] = ['all', 'Pendiente', 'Aprobada', 'Rechazada'];


export default function QuotationsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');

  const { toast } = useToast();
  const firestore = useFirestore();

  // Data Fetching
  const quotesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quotations'))
  }, [firestore]);
  const { data: rawQuotes, isLoading: loadingQuotes } = useCollection<Quote & { date: Timestamp }>(quotesCollection);
  
  const suppliersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suppliers')
  }, [firestore]);
  const { data: suppliers, isLoading: loadingSuppliers } = useCollection<Supplier>(suppliersCollection);

  const productsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products')
  }, [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsCollection);

  const quotes = useMemo(() => {
    if (!rawQuotes) return [];
    return rawQuotes.map(q => ({ ...q, date: q.date.toDate() })).sort((a,b) => b.date.getTime() - a.date.getTime());
  }, [rawQuotes]);

  const loading = loadingQuotes || loadingSuppliers || loadingProducts;
  
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = term === '' || 
            (quote.supplierName && quote.supplierName.toLowerCase().includes(term)) ||
            quote.quoteNumber.toLowerCase().includes(term);
        
        const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;

        return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, filterStatus]);
  

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    try {
        const quoteRef = doc(firestore, 'quotations', id);
        await updateDocumentNonBlocking(quoteRef, { status });
        toast({title: `Cotización marcada como ${status}.`});
    } catch (error) {
        toast({title: 'No se pudo actualizar el estado de la cotización.', variant: 'destructive'});
    }
  }

  const sendWhatsAppNotification = (quoteNumber: string, supplierName: string, total: number, quoteId: string) => {
    const phoneNumber = '524432270901'; // Número del encargado de aprobación
    const appUrl = `${window.location.origin}/erp/quotations`;
    const message = `¡Nueva cotización para aprobación!\n\n*Folio:* ${quoteNumber}\n*Proveedor:* ${supplierName}\n*Total:* ${formatCurrency(total)}\n\n*Revisar en el sistema:*\n${appUrl}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSaveQuote = async (values: any) => {
    const selectedSupplier = suppliers?.find(s => s.id === values.supplierId);
    if (!selectedSupplier) {
      toast({ title: 'Error', description: 'Proveedor no encontrado.', variant: 'destructive' });
      return;
    }

    const itemsWithNames = values.items.map((item: any) => {
        if (item.productId && !item.productName) {
            const product = products?.find(p => p.id === item.productId);
            return { ...item, productName: product?.name || 'Desconocido' };
        }
        return item;
    });

    const total = itemsWithNames.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

    const dataToSave = {
      quoteNumber: values.quoteNumber,
      supplierId: values.supplierId,
      supplierName: selectedSupplier.companyName,
      date: Timestamp.fromDate(values.date),
      items: itemsWithNames,
      total: total,
      campaign: values.agriculturalCampaign || '',
      status: editingQuote ? editingQuote.status : ('Pendiente' as QuoteStatus),
    };

    try {
      if (editingQuote) {
        const quoteRef = doc(firestore, 'quotations', editingQuote.id!);
        await setDocumentNonBlocking(quoteRef, dataToSave, { merge: true });
        toast({ title: 'Cotización actualizada' });
      } else {
        const quotesCollectionRef = collection(firestore, 'quotations');
        const newDocRef = await addDocumentNonBlocking(quotesCollectionRef, dataToSave);
        toast({ title: 'Cotización creada' });
        if (newDocRef) {
          sendWhatsAppNotification(dataToSave.quoteNumber, dataToSave.supplierName, dataToSave.total, newDocRef.id);
        }
      }
      setIsDialogOpen(false);
      setEditingQuote(null);
    } catch (error) {
      console.error("Error saving quote: ", error);
      toast({ title: 'Error', description: 'No se pudo guardar la cotización.', variant: 'destructive' });
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteDocumentNonBlocking(doc(firestore, 'quotations', id));
      toast({ title: 'Cotización eliminada', variant: 'destructive' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la cotización.', variant: 'destructive' });
    }
  };

  const openNewDialog = () => {
    setEditingQuote(null);
    setIsDialogOpen(true);
  };
  

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Listado de Cotizaciones", 105, 30, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });

      const tableColumn = [['No.', 'Proveedor', 'Fecha', 'Estado', 'Valor Total']];
      let totalGeneral = 0;
      const tableRows = filteredQuotes.map(q => {
        const totalValue = q.items.reduce((sum, item) => sum + (item.price || 0), 0);
        totalGeneral += totalValue;
        return [
          q.quoteNumber ?? '',
          q.supplierName ?? '',
          format(q.date, 'dd/MM/yyyy'),
          q.status ?? '',
          formatCurrency(totalValue)
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: tableColumn,
        body: tableRows,
        headStyles: { fillColor: '#2E7D32' },
        didDrawPage: (data) => {
          const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc.internal as any).pages ? (doc.internal as any).pages.length : 1);
          doc.setFontSize(10);
          doc.text('Página ' + data.pageNumber + ' de ' + pageCount, data.settings.margin.left, (doc.internal as any).pageSize.height - 10);
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Valor Total General:', 14, finalY);
      doc.text(formatCurrency(totalGeneral), 196, finalY, { align: 'right' });

      doc.save('reporte_cotizaciones.pdf');
      toast({title: "Reporte de cotizaciones descargado."});
    } catch (error) {
      toast({title: "Error al generar el PDF.", variant: "destructive"});
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusVariant = (status: QuoteStatus) => {
    switch(status) {
        case 'Pendiente': return 'secondary';
        case 'Aprobada': return 'default';
        case 'Rechazada': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cotizaciones de Proveedores</CardTitle>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Exportar
            </Button>
            <Button onClick={openNewDialog}>
                <PlusCircle className="mr-2" />
                Nueva Cotización
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Cotización</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-xs">{quote.quoteNumber}</TableCell>
                  <TableCell>{quote.supplierName}</TableCell>
                  <TableCell>{format(quote.date, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <ul className="text-xs list-disc pl-4">
                        {quote.items.slice(0, 3).map((item, index) => (
                            <li key={index}>{item.productName} - ${item.price.toLocaleString('es-MX')}</li>
                        ))}
                        {quote.items.length > 3 && <li>...y {quote.items.length - 3} más</li>}
                    </ul>
                  </TableCell>
                  <TableCell>
                      <Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {quote.status === 'Pendiente' && (
                          <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()}><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Aprobar</DropdownMenuItem></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Aprobar Cotización?</AlertDialogTitle><AlertDialogDescription>Esta acción marcará la cotización como aprobada y permitirá usarla en órdenes de compra.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleUpdateStatus(quote.id!, 'Aprobada')}>Sí, Aprobar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><XCircle className="mr-2 h-4 w-4" /> Rechazar</DropdownMenuItem></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Rechazar Cotización?</AlertDialogTitle><AlertDialogDescription>Esta acción marcará la cotización como rechazada.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleUpdateStatus(quote.id!, 'Rechazada')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, Rechazar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleEdit(quote)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(quote.id!)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
       <AddQuotationDialog 
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onAddQuotation={handleSaveQuote}
            editingQuotation={editingQuote}
            suppliers={suppliers || []}
            products={products || []}
       />
    </Card>
  );
}
