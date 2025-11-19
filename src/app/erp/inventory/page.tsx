'use client';

import { useState, useMemo, memo } from 'react';
import {
  File,
  ListFilter,
  PlusCircle,
  Search,
  RefreshCw,
  FileDown,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { AddInventoryDialog } from '@/components/erp/add-inventory-dialog';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Branch } from '@/app/hr/branches/page';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';


export type InventoryItem = {
  id: string;
  productName: string;
  sku: string;
  lot: string;
  quantity: number;
  unitPrice: number;
  entryDate: string;
  branchId: string;
};

export default function InventoryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const inventoryCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'inventory');
  }, [firestore, user]);
  const { data: inventory, isLoading } = useCollection<InventoryItem>(inventoryCollection);
  
  const branchesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'branches');
  }, [firestore, user]);
  const { data: branches, isLoading: areBranchesLoading } = useCollection<Branch>(branchesCollection);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getBranchName = (branchId: string) => {
    return branches?.find(b => b.id === branchId)?.name || branchId;
  };

  const handleSaveItem = (itemData: Omit<InventoryItem, 'id' | 'entryDate'>) => {
    if (!firestore) return;
    const id = editingItem ? editingItem.id : `${itemData.sku}-${itemData.lot}`;
    const docRef = doc(firestore, 'inventory', id);
    const itemToSave = {
      id,
      ...itemData,
      entryDate: editingItem ? editingItem.entryDate : format(new Date(), 'dd/MM/yyyy'),
    };
    
    setDocumentNonBlocking(docRef, itemToSave, { merge: true });
    setEditingItem(undefined);
  };
  
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'inventory', id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const handleOpenDialog = (open: boolean) => {
    if (!open) {
        setEditingItem(undefined);
    }
    setIsDialogOpen(open);
  }

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    
    const branchFiltered = inventory.filter(item => 
        selectedBranch === 'all' || item.branchId === selectedBranch
    );

    return branchFiltered.filter(item => 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lot.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm, selectedBranch]);
  
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 15, 12, 40, 15);
      
      doc.setFontSize(18);
      doc.text("Reporte de Inventario", 105, 30, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 37, { align: 'center' });

      const tableColumn = ["Producto", "SKU", "Lote", "Sucursal", "Cantidad", "Precio Unit.", "Valor Total"];
      let totalValue = 0;
      const tableRows: any[] = [];

      filteredInventory.forEach(item => {
        const itemValue = item.quantity * item.unitPrice;
        totalValue += itemValue;
        const itemData = [
          item.productName,
          item.sku,
          item.lot,
          getBranchName(item.branchId),
          item.quantity.toString(),
          formatCurrency(item.unitPrice),
          formatCurrency(itemValue),
        ];
        tableRows.push(itemData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        headStyles: { fillColor: '#2E7D32' }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Valor Total del Inventario:', 14, finalY);
      doc.text(formatCurrency(totalValue), 200, finalY, { align: 'right' });

      doc.save(`reporte_inventario_${Date.now()}.pdf`);
      toast({title: "Reporte PDF generado correctamente."});
    } catch (error) {
      console.error("Error exporting PDF: ", error);
      toast({title: "No se pudo generar el PDF.", variant: "destructive"});
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Inventario
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button size="sm" className='bg-green-600 hover:bg-green-700' onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Lote
          </Button>
          <Button variant="destructive" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Exportar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className='flex items-center gap-4'>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto, SKU o lote..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                 <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={areBranchesLoading}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches?.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
                <ListFilter className="mr-2 h-4 w-4" />
                Bajo stock
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
                <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Fecha Entrada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">Cargando...</TableCell></TableRow>
                ) : filteredInventory.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No hay registros en el inventario.
                    </TableCell>
                    </TableRow>
                ) : (
                    filteredInventory.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className='font-medium'>{item.productName}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.lot}</TableCell>
                        <TableCell>{getBranchName(item.branchId)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>MXN {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.entryDate}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <AddInventoryDialog 
        isOpen={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onAddItem={handleSaveItem}
        editingItem={editingItem}
      />
    </div>
  );
}
