

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, CheckCircle, Truck, XCircle, Pencil, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddPickupDialog } from '@/components/logistics/add-pickup-dialog';
import { AddExpenseDialog } from '@/components/logistics/add-expense-dialog';
import { useLogistics } from '../context';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export type Pickup = {
  id: string;
  folio: string;
  client: string;
  origin: string;
  scheduledDate: string;
  status: 'Programada' | 'En Tránsito' | 'Completada' | 'Cancelada';
  vehicleId?: string;
  purchaseOrderId?: string;
};

export default function PickupsPage() {
  const { vehicles, pickups, isLoading } = useLogistics();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignVehicleOpen, setIsAssignVehicleOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Pickup | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);

  const getVehicleName = (vehicleId?: string) => {
    if (!vehicleId) return <span className="text-xs text-muted-foreground">N/A</span>;
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name : 'Desconocido';
  }

  const handleUpdateStatus = (pickup: Pickup, status: Pickup['status']) => {
    const pickupRef = doc(firestore, 'pickups', pickup.id);
    updateDocumentNonBlocking(pickupRef, { status });
    toast({ title: `Recolección actualizada a: ${status}` });

    if (status === 'Completada' && pickup.purchaseOrderId) {
        toast({
            title: "Redirigiendo a Validación",
            description: "La recolección se completó, ahora valida la recepción de la mercancía."
        });
        router.push(`/inventory-control?orderId=${pickup.purchaseOrderId}`);
    }
  };
  
  const handleOpenAssignDialog = (pickup: Pickup) => {
    setSelectedTrip(pickup);
    setSelectedVehicleId(pickup.vehicleId);
    setIsAssignVehicleOpen(true);
  };
  
  const handleAssignVehicle = () => {
    if (!selectedTrip || !selectedVehicleId) return;
    const pickupRef = doc(firestore, 'pickups', selectedTrip.id);
    updateDocumentNonBlocking(pickupRef, { vehicleId: selectedVehicleId });
    toast({ title: 'Vehículo Asignado', description: 'El vehículo ha sido asignado a la recolección.' });
    setIsAssignVehicleOpen(false);
    setSelectedTrip(null);
  }
  
  const handleOpenExpenseDialog = (trip: Pickup) => {
    setSelectedTrip(trip);
    setIsExpenseDialogOpen(true);
  };
  
  const handleAddExpense = (data: any) => {
    const expensesCollection = collection(firestore, 'logistics_expenses');
    addDocumentNonBlocking(expensesCollection, data);
    toast({ title: 'Gasto Registrado', description: 'El gasto ha sido añadido al viaje.' });
    setIsExpenseDialogOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Gestión de Recolecciones</h1>
        <p className="text-muted-foreground">Coordina y da seguimiento a las recolecciones de campo y de proveedores.</p>
      </div>

      <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
                <div>
                    <CardTitle>Recolecciones Programadas</CardTitle>
                    <CardDescription>Listado de todas las recolecciones activas.</CardDescription>
                </div>
                 <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar Recolección Manual
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente/Proveedor</TableHead>
                    <TableHead>Vehículo Asignado</TableHead>
                    <TableHead>Fecha Prog.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pickups?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay recolecciones programadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pickups?.map(pickup => (
                    <TableRow key={pickup.id}>
                        <TableCell className='font-medium'>{pickup.folio}</TableCell>
                        <TableCell>{pickup.client}</TableCell>
                        <TableCell>{getVehicleName(pickup.vehicleId)}</TableCell>
                        <TableCell>{pickup.scheduledDate}</TableCell>
                        <TableCell>
                            <Badge
                                variant={pickup.status === 'Completada' ? 'secondary' : pickup.status === 'Cancelada' ? 'destructive' : 'outline'}
                                className={cn(
                                    'font-semibold',
                                    pickup.status === 'Programada' && 'bg-blue-100 text-blue-700 border-blue-200',
                                    pickup.status === 'En Tránsito' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                    pickup.status === 'Completada' && 'bg-green-100 text-green-700 border-green-200',
                                    pickup.status === 'Cancelada' && 'bg-red-100 text-red-700 border-red-200'
                                )}>
                                {pickup.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenAssignDialog(pickup)}>
                                        <Truck className="mr-2 h-4 w-4" /> Asignar Vehículo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenExpenseDialog(pickup)}>
                                        <DollarSign className="mr-2 h-4 w-4" /> Registrar Gasto
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(pickup, 'En Tránsito')}>
                                        <Pencil className="mr-2 h-4 w-4" /> Marcar como En Tránsito
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(pickup, 'Completada')}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Completada
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <XCircle className="mr-2 h-4 w-4" /> Cancelar Recolección
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de cancelar esta recolección?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer y marcará la recolección como cancelada.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cerrar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => handleUpdateStatus(pickup, 'Cancelada')}
                                                >
                                                    Sí, Cancelar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                           </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
      <AddPickupDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={(data) => addDocumentNonBlocking(collection(firestore, 'pickups'), data)}
        vehicles={vehicles || []}
      />
       <Dialog open={isAssignVehicleOpen} onOpenChange={setIsAssignVehicleOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Asignar Vehículo a Recolección</DialogTitle>
                <DialogDescription>Folio: {selectedTrip?.folio}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un vehículo disponible..." />
                    </SelectTrigger>
                    <SelectContent>
                        {vehicles?.filter(v => v.status === 'Disponible' || v.id === selectedTrip?.vehicleId).map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} ({vehicle.plate})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignVehicleOpen(false)}>Cancelar</Button>
                <Button onClick={handleAssignVehicle}>Asignar</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
        <AddExpenseDialog
            isOpen={isExpenseDialogOpen}
            onOpenChange={setIsExpenseDialogOpen}
            onSave={handleAddExpense}
            trip={selectedTrip}
            tripType='pickup'
        />
    </div>
  );
}

    