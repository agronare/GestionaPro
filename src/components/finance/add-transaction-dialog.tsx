'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Transaction } from '@/lib/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useEffect } from 'react';

type AddTransactionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: 'income' | 'expense';
  onAddTransaction: (data: Omit<Transaction, 'id' | 'date'>) => void;
};

const transactionSchema = z.object({
  description: z.string().min(2, { message: 'La descripción es requerida.' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser positivo.' }),
  category: z.enum(['Salary', 'Marketing', 'Sales', 'Software', 'Other']),
});

export function AddTransactionDialog({
  isOpen,
  onOpenChange,
  type,
  onAddTransaction,
}: AddTransactionDialogProps) {
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: 'Other',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        category: type === 'income' ? 'Sales' : 'Other',
      });
    }
  }, [isOpen, form, type]);


  const onSubmit = (data: z.infer<typeof transactionSchema>) => {
    onAddTransaction(data);
    onOpenChange(false);
  };
  
  const title = type === 'income' ? 'Añadir Ingreso' : 'Añadir Gasto';
  const description = type === 'income' ? 'Registra un nuevo ingreso.' : 'Registra un nuevo gasto.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder={type === 'income' ? "Ej. Venta de licencias" : "Ej. Pago de nómina"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sales">Ventas</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Salary">Nómina</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
