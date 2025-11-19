'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useForm, Controller } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

type FixedAsset = {
  id: string;
  name: string;
  [key: string]: any;
};

type ScheduledMaintenance = {
    id: string;
    asset: string; // This will now be the Asset ID
    assetName?: string; // Denormalized name
    type: string;
    date: string;
    technician: string;
    cost: number;
    status: 'Programado' | 'En Progreso' | 'Completado';
};

type AddMaintenanceDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddMaintenance: (data: any, assetId?: string) => void;
  editingMaintenance?: ScheduledMaintenance;
};

const maintenanceSchema = z.object({
  asset: z.string().min(1, 'El activo es requerido.'),
  type: z.string().min(1, 'El tipo es requerido.'),
  date: z.date({ required_error: 'La fecha es requerida.' }),
  technician: z.string().min(1, 'El técnico es requerido.'),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  status: z.enum(['Programado', 'En Progreso', 'Completado']),
});

export function AddMaintenanceDialog({
  isOpen,
  onOpenChange,
  onAddMaintenance,
  editingMaintenance,
}: AddMaintenanceDialogProps) {
  const firestore = useFirestore();
  const assetsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'fixed_assets');
  }, [firestore]);
  const { data: assets } = useCollection<FixedAsset>(assetsCollection);
  
  const form = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      asset: '',
      type: 'Preventivo',
      technician: '',
      cost: 0,
      status: 'Programado',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingMaintenance) {
            form.reset({
                ...editingMaintenance,
                date: parse(editingMaintenance.date, 'dd/MM/yyyy', new Date()),
            });
        } else {
            form.reset({
                asset: '',
                type: 'Preventivo',
                technician: '',
                cost: 0,
                status: 'Programado',
                date: new Date(),
            });
        }
    }
  }, [editingMaintenance, isOpen, form]);

  const onSubmit = (data: z.infer<typeof maintenanceSchema>) => {
    const assetName = assets?.find(a => a.id === data.asset)?.name;
    onAddMaintenance({ ...data, assetName }, data.asset);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingMaintenance ? 'Editar Mantenimiento' : 'Programar Nuevo Mantenimiento'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="asset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar activo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets?.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Mantenimiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Preventivo">Preventivo</SelectItem>
                      <SelectItem value="Correctivo">Correctivo</SelectItem>
                      <SelectItem value="Predictivo">Predictivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Programada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
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
            <FormField
              control={form.control}
              name="technician"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico Asignado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Mecánico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo Estimado (MXN)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {editingMaintenance && (
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Programado">Programado</SelectItem>
                                <SelectItem value="En Progreso">En Progreso</SelectItem>
                                <SelectItem value="Completado">Completado</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingMaintenance ? 'Guardar Cambios' : 'Programar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
