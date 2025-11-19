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
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '../ui/scroll-area';
import { useEffect } from 'react';

type Supplier = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  rfc: string;
  [key: string]: any;
};

type AddSupplierDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddSupplier: (data: any) => void;
  editingSupplier?: Supplier;
};

const supplierSchema = z.object({
  companyName: z.string().min(1, { message: 'El nombre de la empresa es requerido.' }),
  contactName: z.string().min(1, { message: 'El nombre del contacto es requerido.' }),
  phone: z.string().min(1, { message: 'El teléfono es requerido.' }),
  mobile: z.string().optional(),
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  rfc: z.string().min(1, { message: 'El RFC es requerido.' }),
  mileage: z.coerce.number().optional(),
  availableCredit: z.coerce.number().optional(),
  enableCredit: z.boolean().default(false),
});

export function AddSupplierDialog({
  isOpen,
  onOpenChange,
  onAddSupplier,
  editingSupplier,
}: AddSupplierDialogProps) {
  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      phone: '',
      mobile: '',
      email: '',
      rfc: '',
      mileage: 0,
      availableCredit: 0,
      enableCredit: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (editingSupplier) {
          form.reset(editingSupplier);
        } else {
          form.reset({
            companyName: '',
            contactName: '',
            phone: '',
            mobile: '',
            email: '',
            rfc: '',
            mileage: 0,
            availableCredit: 0,
            enableCredit: false,
          });
        }
    }
  }, [editingSupplier, form, isOpen]);


  const onSubmit = (data: z.infer<typeof supplierSchema>) => {
    onAddSupplier(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[70vh] pr-6">
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre de la Empresa</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre de la Empresa" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre del Contacto</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del Contacto" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="Teléfono" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Número Móvil</FormLabel>
                                <FormControl>
                                    <Input placeholder="Número Móvil" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                    <Input placeholder="Correo Electrónico" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="rfc"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>RFC del Proveedor</FormLabel>
                                <FormControl>
                                    <Input placeholder="RFC del Proveedor" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mileage"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Kilometraje (ida y vuelta)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Kilometraje (ida y vuelta)" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="availableCredit"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Crédito disponible</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Crédito disponible" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="enableCredit"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className='font-normal'>
                                    Habilitar crédito
                                </FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-6">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">Guardar</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
