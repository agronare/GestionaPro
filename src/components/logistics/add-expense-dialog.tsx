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
import type { Delivery } from '@/app/logistics/deliveries/page';
import type { Pickup } from '@/app/logistics/recolecciones/page';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';


type AddExpenseDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: any) => void;
  trip: Delivery | Pickup | null;
  tripType: 'delivery' | 'pickup';
};

const expenseSchema = z.object({
  concept: z.enum(['Combustible', 'Casetas', 'Viáticos', 'Mantenimiento Menor', 'Otro']),
  amount: z.coerce.number().positive('El monto debe ser un número positivo.'),
  notes: z.string().optional(),
});

export function AddExpenseDialog({
  isOpen,
  onOpenChange,
  onSave,
  trip,
  tripType
}: AddExpenseDialogProps) {
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      concept: 'Combustible',
      amount: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        concept: 'Combustible',
        amount: 0,
        notes: '',
      });
    }
  }, [form, isOpen]);


  const onSubmit = (data: z.infer<typeof expenseSchema>) => {
    if (!trip) return;
    
    const expenseData = {
        ...data,
        date: format(new Date(), 'dd/MM/yyyy'),
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        tripType: tripType,
    };
    onSave(expenseData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Gasto de Viaje</DialogTitle>
          <DialogDescription>Folio de viaje: {trip?.folio}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto del Gasto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un concepto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Combustible">Combustible</SelectItem>
                      <SelectItem value="Casetas">Casetas</SelectItem>
                      <SelectItem value="Viáticos">Viáticos (Comida, etc.)</SelectItem>
                      <SelectItem value="Mantenimiento Menor">Mantenimiento Menor</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (MXN)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Carga de diésel en la gasolinera de la salida." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Gasto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    