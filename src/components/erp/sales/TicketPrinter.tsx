'use client';

import { Sale, Product, SaleItem } from '@/lib/types';
import { formatCurrency } from '@/utils/formatters';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

interface TicketPrinterProps {
  sale: Sale;
  products: Product[];
  onClose: () => void;
}

const IVA_RATE = 0.16;
const ZERO_RATE_CATEGORIES = ['FERTILIZANTE', 'ADHERENTE'];

export const TicketPrinter: React.FC<TicketPrinterProps> = ({ sale, products, onClose }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    setPageUrl('https://agronare.com');
  }, []);

  const calculateTaxes = () => {
    const taxSummary: Record<string, { subtotal: number; tax: number }> = {};
    let totalSubtotal = 0;

    sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const totalItemPrice = item.price * item.quantity;
        const isZeroRate = product?.objetoImp === '04' || (product && ZERO_RATE_CATEGORIES.includes(product.category.toUpperCase()));
        const itemIvaRate = isZeroRate ? 0 : (product?.ivaRate ?? IVA_RATE);
        
        const itemSubtotal = totalItemPrice;
        const itemTax = itemSubtotal * itemIvaRate;

        const rateKey = (itemIvaRate * 100).toFixed(0);
        if (!taxSummary[rateKey]) {
            taxSummary[rateKey] = { subtotal: 0, tax: 0 };
        }
        taxSummary[rateKey].subtotal += itemSubtotal;
        taxSummary[rateKey].tax += itemTax;
        totalSubtotal += itemSubtotal;
    });

    return { taxSummary, totalSubtotal };
  };

  const { taxSummary, totalSubtotal } = calculateTaxes();

  const handlePrint = () => {
    if (ticketRef.current) {
      setIsPrinting(true);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket - Venta ${sale.id}</title>
              <style>
                @page { size: 80mm auto; margin: 0; }
                body { 
                  font-family: 'Courier New', monospace; 
                  margin: 0; 
                  padding: 10px; 
                  font-size: 10px; 
                  width: 78mm;
                }
                .ticket { color: #000; }
                .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                .items { margin: 5px 0; }
                .item { display: flex; justify-content: space-between; }
                .totals { border-top: 1px dashed #000; padding-top: 5px; }
                .footer { text-align: center; margin-top: 5px; font-size: 9px; }
                .line { display: block; overflow: hidden; white-space: normal; word-break: break-all; }
                .qr-code { text-align: center; margin-top: 10px; }
                img { max-width: 100px; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="ticket">${ticketRef.current.innerHTML}</div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 250);
                }
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
      }
      setIsPrinting(false);
    }
  };

  const handleDownloadSimplePDF = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150 + (sale.items?.length || 0) * 15], // Dynamic height
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 5;
    
    // --- Header ---
    try {
        const logoResponse = await fetch('/logo.png');
        const logoBlob = await logoResponse.blob();
        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        const logoBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
        });
        doc.addImage(logoBase64, 'PNG', pageWidth/2 - 10, 5, 20, 20);
    } catch(e) {
        console.error("Error loading logo for ticket:", e);
    }
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(14).setFont('courier', 'bold');
    doc.text("AGRONARE", pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.text("Copándaro, Mich.", pageWidth / 2, 34, { align: 'center' });
    doc.text(`RFC: XAXX010101000`, pageWidth / 2, 38, { align: 'center' });
    doc.line(margin, 42, pageWidth - margin, 42);

    // --- Client Info ---
    doc.text(`Cliente: ${sale.clientName || 'Público General'}`, margin, 47);
    doc.text(`RFC: ${sale.rfc || 'XAXX010101000'}`, margin, 51);
    doc.text(`Fecha: ${new Date(sale.date).toLocaleString('es-MX')}`, margin, 55);
    doc.line(margin, 58, pageWidth - margin, 58);

    // --- Items Table ---
    if (sale.items && sale.items.length > 0) {
      const tableBody: (string | number)[][] = sale.items.map((item: SaleItem) => {
        return [
          item.quantity,
          item.productName,
          formatCurrency(item.price),
          formatCurrency(item.price * item.quantity),
        ];
      });

      autoTable(doc, {
        startY: 60,
        head: [['Cant.', 'Descripción', 'P.U.', 'Importe']],
        body: tableBody,
        theme: 'plain',
        styles: { fontSize: 8, font: 'courier', cellPadding: {top: 0.5, right: 1, bottom: 0.5, left: 1}, halign: 'left' },
        headStyles: { fontStyle: 'bold', halign: 'center'},
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 15, halign: 'right' },
          3: { cellWidth: 15, halign: 'right' },
        },
        margin: { left: margin, right: margin }
      });
    }

    let finalY = (doc as any).lastAutoTable.finalY + 2;
    doc.setFontSize(9);
    
    const totalsXStart = pageWidth - margin - 35;

    doc.text(`Subtotal:`, totalsXStart, finalY, { align: 'right' });
    doc.text(formatCurrency(totalSubtotal), pageWidth - margin, finalY, { align: 'right' });
    finalY += 4;

    Object.entries(taxSummary).forEach(([rate, values]) => {
        doc.text(`IVA (${rate}%):`, totalsXStart, finalY, { align: 'right' });
        doc.text(formatCurrency(values.tax), pageWidth - margin, finalY, { align: 'right' });
        finalY += 4;
    });
    
    finalY += 1;
    doc.setFontSize(11).setFont('courier', 'bold');
    doc.text(`Total:`, totalsXStart, finalY, { align: 'right' });
    doc.text(formatCurrency(sale.total), pageWidth - margin, finalY, { align: 'right' });

    let footerY = finalY + 5;

    doc.line(margin, footerY + 2, pageWidth - margin, footerY + 2);
    doc.setFontSize(8);
    doc.text("¡Gracias por su compra!", pageWidth / 2, footerY + 7, { align: 'center' });
    
    doc.save(`ticket-venta-${sale.id?.substring(0,8)}.pdf`);
  };

  const renderTicketPreview = () => {
    return (
        <div ref={ticketRef} className="p-2 font-mono text-xs text-black bg-gray-50 border w-[300px] mx-auto">
        <div className="text-center mb-2">
            <Image src="/logo.png" alt="Agronare Logo" width={80} height={80} className="mx-auto" />
            <div className="font-bold text-base">AGRONARE</div>
            <div>Copándaro, Mich.</div>
            <div>agronare.com</div>
            <div>RFC: XAXX010101000</div>
            <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>
        </div>
        
        <div className="mb-2">
            <div>Cliente: {sale.clientName || 'Público General'}</div>
            <div>RFC: {sale.rfc || 'XAXX010101000'}</div>
            <div>Fecha: {new Date(sale.date).toLocaleString('es-MX')}</div>
        </div>
        
        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>
        
        <div className="font-bold">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ width: '50%' }}>Desc</span><span>Cant/P.U/Total</span></div>
        </div>
        <div style={{ borderBottom: '1px dashed black', margin: '4px 0' }}></div>

        {sale.items && sale.items.map((item, idx) => {
            const product = products.find(p => p.id === item.productId);
            const totalItemPrice = item.price * item.quantity;
            const isZeroRate = product?.objetoImp === '04' || (product && ZERO_RATE_CATEGORIES.includes(product.category.toUpperCase()));
            const itemIvaRate = isZeroRate ? 0 : (product?.ivaRate ?? IVA_RATE);
            const itemTax = (totalItemPrice / (1 + itemIvaRate)) * itemIvaRate;

            return (
                <div key={idx} className="mb-1">
                    <div className="line">{item.productName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="pl-2" style={{fontSize: '9px'}}>(IVA: {formatCurrency(itemTax)})</span>
                        <span>{item.quantity} × {formatCurrency(item.price)} = {formatCurrency(totalItemPrice)}</span>
                    </div>
                </div>
            );
        })}
        
        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }}></div>
        
        <div style={{ textAlign: 'right' }}>
            <div>Subtotal: {formatCurrency(totalSubtotal)}</div>
            {Object.entries(taxSummary).map(([rate, values]) => (
                <div key={rate}>IVA ({rate}%): {formatCurrency(values.tax)}</div>
            ))}
            <div className="font-bold text-sm mt-1">Total: {formatCurrency(sale.total)}</div>
        </div>
        
        <div className="text-center mt-4">
            <div>¡Gracias por confiar en nosotros!</div>
            <div>¿Necesitas asesoría agronómica? ¡Contáctanos!</div>
        </div>

        {pageUrl && (
            <div className="qr-code text-center mt-4" id="qr-code-section">
                <QRCodeSVG value={pageUrl} size={80} bgColor="#ffffff" fgColor="#000000" level="Q" />
                <p className="text-[8px] mt-1">Visítanos para más información</p>
            </div>
        )}
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ticket / Comprobante
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        
        {/* Vista previa del ticket */}
        <div className="p-4">
          {renderTicketPreview()}
        </div>
        
        <div className="p-4 border-t mt-auto sticky bottom-0 bg-white">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleDownloadSimplePDF}>
              <Download className="w-4 h-4 mr-2" /> Ticket PDF
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={isPrinting}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
