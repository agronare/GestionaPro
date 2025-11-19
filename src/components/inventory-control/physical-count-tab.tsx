'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, FileDown, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import type { InventoryItem, Branch } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';


type InventoryCountItem = {
  id: string;
  productName: string;
  lot: string;
  systemStock: number;
  physicalCount: number | null;
  branchId: string;
};

export function PhysicalCountTab() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const inventoryCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'inventory');
  }, [firestore, user]);
  const { data: inventoryData, isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryCollection);
  
  const branchesCollection = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return collection(firestore, 'branches');
  }, [firestore, user]);
  const { data: branches, isLoading: areBranchesLoading } = useCollection<Branch>(branchesCollection);

  const [items, setItems] = useState<InventoryCountItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (inventoryData) {
      const formattedItems = inventoryData.map(item => ({
        id: item.id,
        productName: item.productName,
        lot: item.lot,
        systemStock: item.quantity,
        physicalCount: null,
        branchId: item.branchId,
      }));
      setItems(formattedItems);
    }
  }, [inventoryData]);


  const handleCountChange = useCallback((id: string, count: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, physicalCount: isNaN(count) ? null : count } : item
      )
    );
  }, []);

  const calculateVariance = (system: number, physical: number | null) => {
    if (physical === null) {
      return null;
    }
    return physical - system;
  };
  
  const filteredItems = useMemo(() => {
    if (selectedBranch === 'all') {
      return items;
    }
    return items.filter(item => item.branchId === selectedBranch);
  }, [items, selectedBranch]);
  
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        const branchName = branches?.find(b => b.id === selectedBranch)?.name || 'Todas las sucursales';

        // Add Header
        doc.setFontSize(18);
        doc.text('Reporte de Conteo Físico', 14, 22);
        doc.setFontSize(11);
        doc.text(`Sucursal: ${branchName}`, 14, 30);
        doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 36);

        // Add Table
        autoTable(doc, {
            startY: 42,
            head: [['Producto', 'Lote', 'Stock (Sistema)', 'Conteo Físico', 'Varianza']],
            body: filteredItems.map(item => {
                const variance = calculateVariance(item.systemStock, item.physicalCount);
                return [
                    item.productName,
                    item.lot,
                    item.systemStock,
                    item.physicalCount ?? '-',
                    variance === null ? '-' : variance,
                ];
            }),
            headStyles: { fillColor: '#2E7D32' },
        });

        doc.save(`conteo_inventario_${branchName.replace(' ', '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({
            title: "PDF Generado",
            description: "El reporte de conteo físico se ha descargado.",
        });
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        toast({
            title: "Error",
            description: "No se pudo generar el reporte en PDF.",
            variant: "destructive",
        });
    } finally {
        setIsExporting(false);
    }
  };


  const isLoading = isInventoryLoading || areBranchesLoading;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className='flex items-center gap-4'>
            <RotateCcw className='h-6 w-6 text-muted-foreground' />
            <div>
              <h2 className="text-lg font-semibold">Conteo Físico Completo</h2>
              <p className="text-sm text-muted-foreground">
                Realiza el inventario de fin de mes para una sucursal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={areBranchesLoading}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {branches?.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Descargar PDF
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Guardar Conteo
            </Button>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-2/5">Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className='text-center'>Stock (Sistema)</TableHead>
                <TableHead className='text-center w-36'>Conteo Físico</TableHead>
                <TableHead className='text-center'>Varianza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No hay inventario para contar en la sucursal seleccionada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => {
                  const variance = calculateVariance(item.systemStock, item.physicalCount);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.lot}</TableCell>
                      <TableCell className="text-center font-medium">{item.systemStock}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          className="w-28 mx-auto text-center"
                          value={item.physicalCount === null ? '' : item.physicalCount}
                          onChange={e => handleCountChange(item.id, parseInt(e.target.value))}
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
