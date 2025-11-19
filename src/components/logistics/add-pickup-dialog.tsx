'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useEffect } from 'react';
import { Vehicle } from '@/app/logistics/context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useFirestore, useUser } from '@/firebase';
import { createNotification } from '@/services/notification-service';

type AddPickupDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: any) => void;
  vehicles: Vehicle[];
};

const pickupSchema = z.object({
  client: z.string().min(1, 'El cliente es requerido.'),
  origin: z.string().min(1, 'El origen es requerido.'),
  vehicleId: z.string().optional(),
  scheduledDate: z.date({ required_error: "La fecha es requerida." }),
});

const mockClients = [
    { id: '1', name: 'Agrícola San Miguel' },
    { id: '2', name: 'Rancho El Maizal' },
];

export function AddPickupDialog({
  isOpen,
  onOpenChange,
  onSave,
  vehicles,
}: AddPickupDialogProps) {
  const form = useForm<z.infer<typeof pickupSchema>>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      client: '',
      origin: '',
      vehicleId: undefined,
      scheduledDate: new Date(),
    },
  });
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    if (isOpen) {
      form.reset({
        client: '',
        origin: '',
        vehicleId: undefined,
        scheduledDate: new Date(),
      });
    }
  }, [form, isOpen]);


  const onSubmit = (data: z.infer<typeof pickupSchema>) => {
    onSave(data);
    if (user && firestore) {
        createNotification(firestore, user.uid, {
            title: 'Nueva Recolección Programada',
            description: `Recolección para ${data.client} en ${data.origin}`,
            link: '/logistics/recolecciones',
            iconName: 'Package',
        });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Recolección</DialogTitle>
           <DialogDescription>
            Completa la información para programar una nueva recolección.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {mockClients.map(client => (
                                <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen de la Recolección</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Rancho San José, Parcela 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Vehículo Asignado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un vehículo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {vehicles.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id} disabled={vehicle.status !== 'Disponible'}>
                                {vehicle.name} ({vehicle.status})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                        <FormLabel>Fecha Programada</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                )}
                                >
                                {field.value ? (
                                    format(field.value, 'PPP')
                                ) : (
                                    <span>Elige una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Recolección</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
