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
import type { Vehicle } from '@/app/logistics/context';

type AddVehicleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: any) => void;
  editingVehicle?: Vehicle;
};

const vehicleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  plate: z.string().min(1, 'La placa es requerida.'),
  type: z.enum(['Camioneta', 'Tractor', 'Camión']),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  capacity: z.string().optional(),
  fuelEfficiency: z.coerce.number().positive('El rendimiento debe ser un número positivo.').optional(),
  fuelType: z.enum(['Diesel', 'Gasolina']).optional(),
});

export function AddVehicleDialog({
  isOpen,
  onOpenChange,
  onSave,
  editingVehicle,
}: AddVehicleDialogProps) {
  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: '',
      plate: '',
      type: 'Camioneta',
      brand: '',
      model: '',
      year: undefined,
      capacity: '',
      fuelEfficiency: undefined,
      fuelType: 'Diesel',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingVehicle) {
        form.reset({
            ...editingVehicle,
            year: editingVehicle.year || undefined,
            brand: editingVehicle.brand || '',
            model: editingVehicle.model || '',
            capacity: editingVehicle.capacity || '',
            fuelEfficiency: editingVehicle.fuelEfficiency || undefined,
            fuelType: editingVehicle.fuelType || 'Diesel',
        });
      } else {
        form.reset({
          name: '',
          plate: '',
          type: 'Camioneta',
          brand: '',
          model: '',
          year: undefined,
          capacity: '',
          fuelEfficiency: undefined,
          fuelType: 'Diesel',
        });
      }
    }
  }, [editingVehicle, form, isOpen]);


  const onSubmit = (data: z.infer<typeof vehicleSchema>) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingVehicle ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo'}</DialogTitle>
           <DialogDescription>
            {editingVehicle ? 'Modifica los detalles del vehículo.' : 'Completa la información del nuevo vehículo para tu flota.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre o Alias del Vehículo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Camioneta de Reparto 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                        <Input placeholder="ABC-123-XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Vehículo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Camioneta">Camioneta</SelectItem>
                        <SelectItem value="Tractor">Tractor</SelectItem>
                        <SelectItem value="Camión">Camión</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Nissan" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: NP300" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Año</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Ej: 2022" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Capacidad de Carga</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: 1.5 Ton" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="fuelEfficiency"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rendimiento (km/l)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.1" placeholder="Ej: 12.5" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Combustible</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                        <SelectItem value="Gasolina">Gasolina</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingVehicle ? 'Guardar Cambios' : 'Añadir Vehículo'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    