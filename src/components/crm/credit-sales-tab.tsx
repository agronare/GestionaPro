'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Sale } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Payment } from '@/docs/backend.json';

interface CreditSaleView extends Sale {
    balance: number;
    status: 'Pendiente' | 'Pagada' | 'Vencida';
    dueDate: Date;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Pagada': return 'default';
        case 'Pendiente': return 'secondary';
        case 'Vencida': return 'destructive';
        default: return 'outline';
    }
}

export function CreditSalesTab() {
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedSale, setSelectedSale] = useState<CreditSaleView | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const salesQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, "sales"), where("paymentMethod", "==", "Crédito")) : null, 
    [firestore]);
    const { data: allSales, isLoading: loadingSales } = useCollection<Sale>(salesQuery);
    
    const paymentsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, "payments"), where("type", "==", "client")) : null, 
    [firestore]);
    const { data: allPayments, isLoading: loadingPayments } = useCollection<Payment>(paymentsQuery);
    
    const loading = loadingSales || loadingPayments;

    const creditSales = useMemo((): CreditSaleView[] => {
        if (!allSales || !allPayments) return [];

        const paymentsBySaleId = allPayments.reduce((acc, payment) => {
            if (payment.saleId) {
                if (!acc[payment.saleId]) acc[payment.saleId] = 0;
                acc[payment.saleId] += payment.amount;
            }
            return acc;
        }, {} as Record<string, number>);
        
        const creditPeriodDays = 30;

        return allSales.map(sale => {
            const saleDate = sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date);
            const totalPaid = paymentsBySaleId[sale.id!] || 0;
            const balance = sale.total - totalPaid;
            const dueDate = new Date(saleDate);
            dueDate.setDate(dueDate.getDate() + creditPeriodDays);
            
            let status: 'Pendiente' | 'Pagada' | 'Vencida' = 'Pendiente';
            if (balance <= 0.01) status = 'Pagada';
            else if (new Date() > dueDate) status = 'Vencida';
            
            return { ...sale, date: saleDate, balance, status, dueDate };
        });
    }, [allSales, allPayments]);


    const handleViewDetails = (sale: CreditSaleView) => {
        setSelectedSale(sale);
        setIsDetailOpen(true);
    };

    const handleDownloadPDF = async () => {
        if (!selectedSale) return;
        const doc = new jsPDF();

        try {
            const logoResponse = await fetch('/logo.png');
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(logoBlob);
            });
            doc.addImage(logoBase64, 'PNG', 15, 15, 30, 10);
        } catch (error) {
            console.error("Could not load logo for PDF", error);
        }

        doc.setFontSize(18);
        doc.text('Detalle de Venta a Crédito', 105, 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Folio: ${selectedSale.id?.substring(0, 7)}`, 15, 50);
        doc.text(`Cliente: ${selectedSale.clientName}`, 15, 57);
        doc.text(`Fecha: ${format(selectedSale.date, 'dd/MM/yyyy')}`, 15, 64);
        doc.text(`Vencimiento: ${format(selectedSale.dueDate, 'dd/MM/yyyy')}`, 15, 71);

        autoTable(doc, {
            startY: 80,
            head: [['Producto', 'Cantidad', 'Precio Unitario', 'Importe']],
            body: selectedSale.items.map(item => [
                item.productName,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.price * item.quantity),
            ]),
            headStyles: { fillColor: '#2E7D32' }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`Total: ${formatCurrency(selectedSale.total)}`, 15, finalY);
        doc.text(`Saldo: ${formatCurrency(selectedSale.balance)}`, 15, finalY + 7);

        doc.save(`detalle_venta_${selectedSale.id?.substring(0, 7)}.pdf`);
    };


    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                         <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : creditSales.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay ventas a crédito registradas.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Folio</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Saldo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {creditSales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-bold">{sale.id?.substring(0, 7) || 'N/A'}</TableCell>
                                        <TableCell>{sale.clientName}</TableCell>
                                        <TableCell>{formatCurrency(sale.total)}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(sale.balance)}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(sale.status)}>{sale.status}</Badge></TableCell>
                                        <TableCell>{format(sale.dueDate, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(sale)}>
                                                Ver Detalles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Venta a Crédito</DialogTitle>
                        <DialogDescription>Folio: {selectedSale?.id?.substring(0, 7)}</DialogDescription>
                    </DialogHeader>
                    {selectedSale && (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <p><strong>Cliente:</strong> {selectedSale.clientName}</p>
                                <p><strong>Fecha:</strong> {format(selectedSale.date, 'dd/MM/yyyy')}</p>
                                <p><strong>Total:</strong> {formatCurrency(selectedSale.total)}</p>
                                <p><strong>Saldo:</strong> {formatCurrency(selectedSale.balance)}</p>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Cant.</TableHead>
                                        <TableHead>P. Unit.</TableHead>
                                        <TableHead>Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSale.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{formatCurrency(item.price)}</TableCell>
                                            <TableCell>{formatCurrency(item.price * item.quantity)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-4 flex justify-end">
                                <Button onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" />Descargar PDF</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
