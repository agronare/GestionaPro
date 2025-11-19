'use client';
import { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddBranchDialog } from '@/components/hr/add-branch-dialog';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export type Branch = {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
};

export default function BranchesPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const branchesCollection = useMemoFirebase(() => {
      if(!firestore || !user) return null;
      return collection(firestore, 'branches');
    }, [firestore, user]);
    const { data: branches, isLoading } = useCollection<Branch>(branchesCollection);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | undefined>(undefined);

    const handleSaveBranch = (data: Omit<Branch, 'id'>) => {
        if (!firestore) return;
        const id = editingBranch ? editingBranch.id : `BR-${Date.now()}`;
        const docRef = doc(firestore, 'branches', id);
        
        const branchData = {
            id,
            ...data
        };
        
        setDocumentNonBlocking(docRef, branchData, { merge: true });
    };
    
    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'branches', id);
        deleteDocumentNonBlocking(docRef);
    };

    const onOpenChange = (open: boolean) => {
        if (!open) {
            setEditingBranch(undefined);
        }
        setIsDialogOpen(open);
    }

  return (
    <div className="flex flex-col gap-6">
      <div className='flex items-center justify-between'>
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
            Sucursales
            </h1>
            <p className="text-muted-foreground">
            Gestiona las ubicaciones y centros de trabajo de tu empresa.
            </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className='h-4 w-4 mr-2' />
            Nueva Sucursal
        </Button>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Listado de Sucursales</CardTitle>
            <CardDescription>Aquí puedes ver y gestionar todas tus sucursales.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className='rounded-lg border'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className='text-right'>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 2}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className='text-right'><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : branches?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No hay sucursales registradas.
                                </TableCell>
                            </TableRow>
                        ) : branches?.map(branch => (
                            <TableRow key={branch.id}>
                                <TableCell className='font-medium'>{branch.name}</TableCell>
                                <TableCell>{`${branch.address}, ${branch.city}, ${branch.state} ${branch.postalCode}`}</TableCell>
                                <TableCell>{branch.phone}</TableCell>
                                <TableCell className='text-right'>
                                     <div className='flex gap-2 justify-end'>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(branch.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      <AddBranchDialog
        isOpen={isDialogOpen}
        onOpenChange={onOpenChange}
        onSave={handleSaveBranch}
        editingBranch={editingBranch}
      />
    </div>
  );
}
