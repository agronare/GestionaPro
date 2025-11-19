'use client';
import { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { AddSupplierDialog } from '@/components/erp/add-supplier-dialog';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';


export type Supplier = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  rfc: string;
};

export default function SuppliersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const suppliersCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'suppliers');
  }, [firestore, user]);

  const { data: suppliers, isLoading } = useCollection<Supplier>(suppliersCollection);

  const handleAddSupplier = (newSupplierData: Omit<Supplier, 'id'>) => {
    if (!firestore) return;
    const id = editingSupplier ? editingSupplier.id : `SUP-${Date.now()}`;
    const docRef = doc(firestore, 'suppliers', id);
    setDocumentNonBlocking(docRef, { ...newSupplierData }, { merge: true });
    setEditingSupplier(undefined);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };
  
  const handleOpenDialog = (open: boolean) => {
    if (!open) {
        setEditingSupplier(undefined);
    }
    setIsDialogOpen(open);
  }

  const handleDelete = (supplierId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'suppliers', supplierId);
    deleteDocumentNonBlocking(docRef);
  }

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.filter(s => 
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rfc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">ERP / Proveedores</h1>
        <p className="text-muted-foreground">Administra tus proveedores.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nombre, contacto o RFC..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo Proveedor
                </Button>
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nombre Empresa</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell></TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay proveedores registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map(supplier => (
                    <TableRow key={supplier.id}>
                        <TableCell className='font-medium'>{supplier.companyName}</TableCell>
                        <TableCell>{supplier.contactName}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.rfc}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(supplier.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <AddSupplierDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onAddSupplier={handleAddSupplier}
        editingSupplier={editingSupplier}
      />
    </div>
  );
}
