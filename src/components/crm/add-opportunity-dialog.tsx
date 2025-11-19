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
import { Textarea } from '@/components/ui/textarea';
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
import { useFirestore, useUser } from '@/firebase';
import { createNotification } from '@/services/notification-service';

type AddOpportunityDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddOpportunity: (data: any) => void;
};

const opportunitySchema = z.object({
  opportunityName: z.string().min(1, 'El nombre es requerido.'),
  client: z.string().min(1, 'Selecciona un cliente.'),
  estimatedValue: z.coerce.number().min(0, 'El valor debe ser positivo.'),
  source: z.string().optional(),
  notes: z.string().optional(),
});

// Mock data, en una app real vendría de la base de datos
const mockClients = [
    { id: '1', name: 'Agrícola San Miguel' },
    { id: '2', name: 'Rancho El Maizal' },
];

export function AddOpportunityDialog({
  isOpen,
  onOpenChange,
  onAddOpportunity,
}: AddOpportunityDialogProps) {
  const form = useForm<z.infer<typeof opportunitySchema>>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      opportunityName: '',
      client: '',
      estimatedValue: 0,
      source: '',
      notes: '',
    },
  });
  const firestore = useFirestore();
  const { user } = useUser();

  const onSubmit = (data: z.infer<typeof opportunitySchema>) => {
    onAddOpportunity(data);
    if(user && firestore) {
        createNotification(firestore, user.uid, {
            title: 'Nueva Oportunidad',
            description: `Se creó la oportunidad: ${data.opportunityName}`,
            link: '/crm/pipeline',
            iconName: 'TrendingUp',
        });
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Oportunidad de Venta</DialogTitle>
          <DialogDescription>Completa los datos de la nueva oportunidad.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="opportunityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Oportunidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Venta de 10t de fertilizante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockClients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Estimado (MXN)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuente (Opcional)</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar fuente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Llamada">Llamada en frío</SelectItem>
                      <SelectItem value="Referido">Referido</SelectItem>
                      <SelectItem value="Web">Sitio Web</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea placeholder="Añade notas relevantes sobre la oportunidad..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Crear Oportunidad</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
