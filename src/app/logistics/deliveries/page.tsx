
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  MoreHorizontal,
  Truck,
  Pencil,
  CheckCircle,
  XCircle,
  DollarSign,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddDeliveryDialog } from '@/components/logistics/add-delivery-dialog';
import { AddExpenseDialog } from '@/components/logistics/add-expense-dialog';
import { format } from 'date-fns';
import { useLogistics } from '../context';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


export type Delivery = {
  id: string;
  folio: string;
  client: string;
  destination: string;
  deliveryDate: string;
  status: 'En Preparación' | 'En Ruta' | 'Entregada' | 'Cancelada';
  vehicleId?: string;
};

export default function DeliveriesPage() {
  const { vehicles, deliveries, isLoading } = useLogistics();
  const firestore = useFirestore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignVehicleOpen, setIsAssignVehicleOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Delivery | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);

  const getVehicleName = (vehicleId?: string) => {
    if (!vehicleId) return <span className="text-xs text-muted-foreground">N/A</span>;
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name : 'Desconocido';
  }

  const handleAddDelivery = (data: Omit<Delivery, 'id' | 'folio' | 'status' | 'deliveryDate'> & { deliveryDate: Date }) => {
    const deliveriesCollection = collection(firestore, 'deliveries');
    const newDelivery: Omit<Delivery, 'id'> = {
      folio: `ENT-${Date.now().toString().slice(-6)}`,
      client: data.client,
      destination: data.destination,
      deliveryDate: format(data.deliveryDate, 'dd/MM/yyyy'),
      status: 'En Preparación',
      vehicleId: data.vehicleId,
    };
    addDocumentNonBlocking(deliveriesCollection, newDelivery);
  };
  
  const handleUpdateStatus = (delivery: Delivery, status: Delivery['status']) => {
    const deliveryRef = doc(firestore, 'deliveries', delivery.id);
    updateDocumentNonBlocking(deliveryRef, { status });
    toast({ title: `Entrega actualizada a: ${status}` });
  };
  
  const handleOpenAssignDialog = (delivery: Delivery) => {
    setSelectedTrip(delivery);
    setSelectedVehicleId(delivery.vehicleId);
    setIsAssignVehicleOpen(true);
  };
  
  const handleAssignVehicle = () => {
    if (!selectedTrip || !selectedVehicleId) return;
    const deliveryRef = doc(firestore, 'deliveries', selectedTrip.id);
    updateDocumentNonBlocking(deliveryRef, { vehicleId: selectedVehicleId });
    toast({ title: 'Vehículo Asignado', description: 'El vehículo ha sido asignado a la entrega.' });
    setIsAssignVehicleOpen(false);
    setSelectedTrip(null);
  }
  
  const handleOpenExpenseDialog = (trip: Delivery) => {
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Gestión de Entregas</h1>
        <p className="text-muted-foreground">Coordina y da seguimiento a las entregas a clientes.</p>
      </div>

      <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
                <div>
                    <CardTitle>Entregas Programadas</CardTitle>
                    <CardDescription>Listado de todas las entregas activas.</CardDescription>
                </div>
                 <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar Entrega
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Folio</TableHead>
                    <TableHead>Cliente</TableHead>
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
                  ) : deliveries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay entregas programadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries?.map(delivery => (
                    <TableRow key={delivery.id}>
                        <TableCell className='font-medium'>{delivery.folio}</TableCell>
                        <TableCell>{delivery.client}</TableCell>
                        <TableCell>{getVehicleName(delivery.vehicleId)}</TableCell>
                        <TableCell>{delivery.deliveryDate}</TableCell>
                        <TableCell>
                            <Badge
                                variant={delivery.status === 'Entregada' ? 'secondary' : delivery.status === 'Cancelada' ? 'destructive' : 'outline'}
                                className={cn(
                                    'font-semibold',
                                    delivery.status === 'En Preparación' && 'bg-blue-100 text-blue-700 border-blue-200',
                                    delivery.status === 'En Ruta' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                    delivery.status === 'Entregada' && 'bg-green-100 text-green-700 border-green-200',
                                    delivery.status === 'Cancelada' && 'bg-red-100 text-red-700 border-red-200'
                                )}>
                                {delivery.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                     <DropdownMenuItem onClick={() => handleOpenAssignDialog(delivery)}>
                                        <Truck className="mr-2 h-4 w-4" /> Asignar Vehículo
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleOpenExpenseDialog(delivery)}>
                                        <DollarSign className="mr-2 h-4 w-4" /> Registrar Gasto
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(delivery, 'En Ruta')}>
                                        <Pencil className="mr-2 h-4 w-4" /> Marcar como En Ruta
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(delivery, 'Entregada')}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Entregada
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <XCircle className="mr-2 h-4 w-4" /> Cancelar Entrega
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de cancelar esta entrega?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer y marcará la entrega como cancelada.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cerrar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => handleUpdateStatus(delivery, 'Cancelada')}
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
      <AddDeliveryDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddDelivery}
        vehicles={vehicles || []}
      />
      <Dialog open={isAssignVehicleOpen} onOpenChange={setIsAssignVehicleOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Asignar Vehículo a Entrega</DialogTitle>
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
            tripType='delivery'
        />
    </div>
  );
}

    