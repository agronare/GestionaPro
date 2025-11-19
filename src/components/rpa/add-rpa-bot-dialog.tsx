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
import { Textarea } from '@/components/ui/textarea';
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
import type { BotProcess } from '@/app/rpa/page';

type AddRpaBotDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddBot: (data: any) => void;
  editingBot?: BotProcess;
};

const rpaBotSchema = z.object({
  name: z.string().min(1, 'El nombre del bot es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
  trigger: z.string().min(1, 'Selecciona un activador.'),
  frequency: z.string().optional(),
});

export function AddRpaBotDialog({
  isOpen,
  onOpenChange,
  onAddBot,
  editingBot,
}: AddRpaBotDialogProps) {
  const form = useForm<z.infer<typeof rpaBotSchema>>({
    resolver: zodResolver(rpaBotSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger: 'manual',
      frequency: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingBot) {
            form.reset({
                name: editingBot.name,
                description: editingBot.description,
                trigger: editingBot.trigger || 'manual',
                frequency: editingBot.frequency || '',
            });
        } else {
            form.reset({
                name: '',
                description: '',
                trigger: 'manual',
                frequency: '',
            });
        }
    }
  }, [editingBot, form, isOpen]);

  const trigger = form.watch('trigger');

  const onSubmit = (data: z.infer<typeof rpaBotSchema>) => {
    onAddBot(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingBot ? 'Editar Bot de RPA' : 'Crear Nuevo Bot de RPA'}</DialogTitle>
          <DialogDescription>
            {editingBot ? 'Modifica la configuración de tu bot.' : 'Configura un nuevo proceso para automatizar tareas repetitivas.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Bot</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Conciliación Bancaria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe qué hace este bot..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trigger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activador</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="¿Cómo se ejecutará?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="scheduled">Programado</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {trigger === 'scheduled' && (
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Cada 24 horas, L-V a las 9am" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingBot ? 'Guardar Cambios' : 'Crear Bot'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
