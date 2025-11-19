'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddMaintenanceDialog } from '@/components/erp/add-maintenance-dialog';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export type ScheduledMaintenance = {
    id: string;
    asset: string; // Asset ID
    assetName?: string; // Denormalized name for display
    type: string;
    date: string;
    technician: string;
    cost: number;
    status: 'Programado' | 'En Progreso' | 'Completado';
};

export default function MaintenancePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const maintenanceCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'maintenances');
  }, [firestore, user]);
  const { data: allScheduled, isLoading } = useCollection<ScheduledMaintenance>(maintenanceCollection);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<ScheduledMaintenance | undefined>(undefined);

  const handleSaveMaintenance = (data: Omit<ScheduledMaintenance, 'id' | 'date'> & { date: Date }, assetId?: string) => {
     if (!firestore) return;
     const id = editingMaintenance ? editingMaintenance.id : `MAINT-${Date.now()}`;
     const docRef = doc(firestore, 'maintenances', id);
     
     const maintenanceData = {
       ...data,
       date: format(data.date, 'dd/MM/yyyy'),
     };
     setDocumentNonBlocking(docRef, maintenanceData, { merge: true });

     // Update the asset's status
     if (assetId) {
        const assetRef = doc(firestore, 'fixed_assets', assetId);
        const newStatus = data.status === 'Completado' ? 'activo' : 'mantenimiento';
        updateDocumentNonBlocking(assetRef, { status: newStatus });
     }
  };
  
  const handleEdit = (item: ScheduledMaintenance) => {
    setEditingMaintenance(item);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'maintenances', id);
    deleteDocumentNonBlocking(docRef);
    // Note: This doesn't automatically change the asset status back to 'active'.
    // A more robust implementation might require checking if other maintenances are active for the asset.
  };
  
  const handleOpenDialog = (open: boolean) => {
    if (!open) {
        setEditingMaintenance(undefined);
    }
    setIsDialogOpen(open);
  };

  const { scheduled, history } = useMemo(() => {
    const scheduled = allScheduled?.filter(item => item.status !== 'Completado') || [];
    const history = allScheduled?.filter(item => item.status === 'Completado') || [];
    return { scheduled, history };
  }, [allScheduled]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Mantenimiento
        </h1>
        <p className="text-muted-foreground">
            Gestión de equipos, maquinaria y herramientas agrícolas.
        </p>
      </div>
      <Tabs defaultValue="scheduled">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="scheduled">Mantenimientos Programados</TabsTrigger>
          <TabsTrigger value="corrective">Mantenimientos Correctivos</TabsTrigger>
          <TabsTrigger value="history">Historial de Mantenimientos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas y Próximos Servicios</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Mantenimientos Programados</h3>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Mantenimiento
                    </Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Activo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Técnico</TableHead>
                        <TableHead>Costo Est.</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className='text-right'>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center">Cargando...</TableCell></TableRow>
                      ) : scheduled?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No hay mantenimientos programados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduled?.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className='font-medium'>{item.assetName || item.asset}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.technician}</TableCell>
                            <TableCell>MXN {item.cost.toFixed(2)}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell className='text-right'>
                                <div className='flex gap-2 justify-end'>
                                    <Button variant='ghost' size='icon' onClick={() => handleEdit(item)}>
                                        <Pencil className='h-4 w-4'/>
                                    </Button>
                                    <Button variant='ghost' size='icon' className='text-destructive hover:text-destructive' onClick={() => handleDelete(item.id)}>
                                        <Trash2 className='h-4 w-4'/>
                                    </Button>
                                </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Placeholder for other tabs */}
        <TabsContent value="corrective">
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Próximamente: Mantenimientos Correctivos.</p>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="history">
            <Card>
                <CardHeader>
                    <h3 className="font-semibold">Historial de Mantenimientos</h3>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Activo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Técnico</TableHead>
                            <TableHead>Costo</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell></TableRow>
                          ) : history?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                No hay mantenimientos completados.
                              </TableCell>
                            </TableRow>
                          ) : (
                            history?.map(item => (
                              <TableRow key={item.id}>
                                <TableCell className='font-medium'>{item.assetName || item.asset}</TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.date}</TableCell>
                                <TableCell>{item.technician}</TableCell>
                                <TableCell>MXN {item.cost.toFixed(2)}</TableCell>
                                <TableCell>{item.status}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="alerts">
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Próximamente: Alertas y Próximos Servicios.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      <AddMaintenanceDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onAddMaintenance={handleSaveMaintenance}
        editingMaintenance={editingMaintenance}
      />
    </div>
  );
}
