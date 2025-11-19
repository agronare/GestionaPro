'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Pencil,
  Trash2
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
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { AddVehicleDialog } from '@/components/logistics/add-vehicle-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLogistics, type Vehicle } from '../context';
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function FleetPage() {
  const { vehicles, isLoading } = useLogistics();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);

  const handleAddOrEditVehicle = (data: Omit<Vehicle, 'id' | 'status'>) => {
    if (editingVehicle) {
        const docRef = doc(firestore, 'vehicles', editingVehicle.id);
        setDocumentNonBlocking(docRef, data, { merge: true });
    } else {
        const id = `VEH-${Date.now()}`;
        const docRef = doc(firestore, 'vehicles', id);
        const newVehicle: Omit<Vehicle, 'id'> = {
            status: 'Disponible',
            ...data,
        };
        setDocumentNonBlocking(docRef, newVehicle, { merge: true });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };
  
  const handleOpenDialog = (open: boolean) => {
    if (!open) {
        setEditingVehicle(undefined);
    }
    setIsDialogOpen(open);
  }

  const handleDelete = (vehicleId: string) => {
    const docRef = doc(firestore, 'vehicles', vehicleId);
    deleteDocumentNonBlocking(docRef);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Gestión de Flota</h1>
        <p className="text-muted-foreground">Administra los vehículos de tu operación.</p>
      </div>

      <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
                <div>
                    <CardTitle>Vehículos</CardTitle>
                    <CardDescription>Listado de todos los vehículos registrados.</CardDescription>
                </div>
                 <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Vehículo
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : vehicles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay vehículos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles?.map(vehicle => (
                    <TableRow key={vehicle.id}>
                        <TableCell className='font-medium'>{vehicle.name}</TableCell>
                        <TableCell>{vehicle.plate}</TableCell>
                        <TableCell>{vehicle.type}</TableCell>
                        <TableCell>
                            <Badge
                                variant={vehicle.status === 'Disponible' ? 'secondary' : vehicle.status === 'En Ruta' ? 'outline' : 'destructive'}
                                className={cn(
                                    vehicle.status === 'Disponible' && 'bg-green-100 text-green-700',
                                    vehicle.status === 'En Ruta' && 'bg-blue-100 text-blue-700',
                                    vehicle.status === 'Mantenimiento' && 'bg-yellow-100 text-yellow-700'
                                )}>
                                {vehicle.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(vehicle.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
      <AddVehicleDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onSave={handleAddOrEditVehicle}
        editingVehicle={editingVehicle}
      />
    </div>
  );
}

