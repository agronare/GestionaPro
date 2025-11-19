'use client';

import { PurchaseOrder } from "@/lib/types";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Printer, Package, Building, User, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/layout/logo";
import { useRef } from "react";

interface PurchaseTicketProps {
  purchase: PurchaseOrder;
  onClose: () => void;
}

export function PurchaseTicket({ purchase, onClose }: PurchaseTicketProps) {
  const ticketContentRef = useRef<HTMLDivElement>(null);

  const subtotal = purchase.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const associatedCosts = purchase.associatedCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;

  const handlePrint = () => {
    const node = ticketContentRef.current;
    if (node) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Orden de Compra</title>');
        
        // Clone all stylesheets from the parent document
        Array.from(document.styleSheets).forEach(styleSheet => {
          try {
            const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            const styleElement = printWindow.document.createElement('style');
            styleElement.appendChild(printWindow.document.createTextNode(cssRules));
            printWindow.document.head.appendChild(styleElement);
          } catch (e) {
            // Some stylesheets may have CORS restrictions
            if (styleSheet.href) {
                const linkElement = printWindow.document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = styleSheet.href;
                printWindow.document.head.appendChild(linkElement);
            }
          }
        });

        // Add print-specific styles
        printWindow.document.write(`
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body { margin: 0; }
            .printable-area { 
              max-width: 800px; 
              margin: auto; 
              padding: 2rem; 
              background-color: white;
            }
          </style>
        `);
        
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="printable-area">');
        printWindow.document.write(node.innerHTML);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Use a timeout to ensure all content and styles are loaded
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <Card className="w-full max-w-2xl relative animate-in fade-in-0 zoom-in-95">
            <div id="ticket-content-display" className="p-6">
                 <div ref={ticketContentRef} className="printable-content">
                    <CardHeader className="p-0 mb-6 header">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4 header-left">
                                <Logo />
                                <div>
                                    <p className="font-bold text-lg">AGRONARE SA DE CV</p>
                                    <p className="text-xs text-muted-foreground">RFC: XEXX010101000</p>
                                </div>
                            </div>
                            <div className="text-right header-right">
                                <CardTitle className="text-xl text-primary">Orden de Compra</CardTitle>
                                <p className="text-sm text-muted-foreground font-mono">{purchase.id?.substring(0, 7)}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-6 details">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">Proveedor:</span>
                                    <span>{purchase.supplierName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">Pago:</span>
                                    <span>{purchase.paymentMethod}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="font-semibold">Fecha:</span>
                                    <span>{format(purchase.date, 'dd/MM/yyyy')}</span>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <span className="font-semibold">Estado:</span>
                                    <span>{purchase.status}</span>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table className="table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-center">Cant.</TableHead>
                                        <TableHead className="text-right">Costo Unit.</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.items.map(item => (
                                        <TableRow key={item.productId}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.cost * item.quantity)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                            <div className="w-full max-w-sm space-y-2 text-sm totals">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal Productos:</span>
                                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                                </div>
                                {purchase.associatedCosts && purchase.associatedCosts.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Costos Adicionales:</span>
                                        <span className="font-medium">{formatCurrency(associatedCosts)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(purchase.total)}</span>
                                </div>
                            </div>
                        </div>
                        {purchase.notes && (
                            <div className="mt-6 border-t pt-4">
                                <h4 className="font-semibold text-sm mb-1">Notas:</h4>
                                <p className="text-xs text-muted-foreground">{purchase.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </div>
            </div>
            <CardFooter className="p-6 bg-muted/50 justify-between items-center no-print">
                <p className="text-xs text-muted-foreground">¡Gracias por su preferencia!</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={handlePrint}><Printer className="mr-2" />Imprimir</Button>
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
