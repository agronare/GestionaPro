import type { Invoice } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

type InvoiceListProps = {
  invoices: Invoice[] | null;
  isLoading: boolean;
  onAction: (action: 'view' | 'download', invoiceId: string) => void;
  onCancel: (invoice: Invoice) => void;
};

export function InvoiceList({ invoices, isLoading, onAction, onCancel }: InvoiceListProps) {
  const getStatusInfo = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return { text: 'Pagada', className: 'bg-green-100 text-green-700 border-green-500/20' };
      case 'Pending':
        return { text: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 border-yellow-500/20' };
      case 'Overdue':
        return { text: 'Vencida', className: 'bg-red-100 text-red-700 border-red-500/20' };
      case 'Cancelled':
          return { text: 'Cancelada', className: 'bg-gray-100 text-gray-600 border-gray-500/20' };
      default:
        return { text: 'Desconocido', className: 'bg-gray-100 text-gray-600' };
    }
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Factura</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="hidden md:table-cell">Fecha de Emisión</TableHead>
          <TableHead className="hidden lg:table-cell">Fecha de Vencimiento</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
          ))
        ) : !invoices || invoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              No hay facturas para mostrar.
            </TableCell>
          </TableRow>
        ) : (
        invoices.map(invoice => {
            const statusInfo = getStatusInfo(invoice.status);
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>
                  <Badge
                    variant='outline'
                    className={cn('font-semibold', statusInfo.className)}
                  >
                    {statusInfo.text}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{invoice.issueDate}</TableCell>
                <TableCell className="hidden lg:table-cell">{invoice.dueDate}</TableCell>
                <TableCell className="text-right font-semibold">
                  ${invoice.amount.toLocaleString('es-MX')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAction('view', invoice.id)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction('download', invoice.id)}>Descargar PDF</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => onCancel(invoice)}
                        disabled={invoice.status === 'Cancelled' || invoice.status === 'Paid'}
                      >
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
        }))}
      </TableBody>
    </Table>
  );
}
