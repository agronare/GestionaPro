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
import type { Document, Employee } from '@/lib/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';


type AddDocumentDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddDocument: (data: Omit<Document, 'id' | 'uploadDate' | 'size' | 'fileLocation'>) => void;
};

const documentSchema = z.object({
  name: z.string().min(2, { message: 'El nombre del archivo es requerido.' }),
  uploadedBy: z.string().min(1, { message: 'Selecciona un empleado.' }),
  employeeId: z.string().min(1, { message: 'El ID de empleado es requerido.' }),
});

export function AddDocumentDialog({
  isOpen,
  onOpenChange,
  onAddDocument,
}: AddDocumentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const employeesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'employees');
  }, [firestore, user]);
  const { data: employees } = useCollection<Employee>(employeesCollection);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      uploadedBy: '',
      employeeId: '',
    },
  });

  const onSubmit = (data: z.infer<typeof documentSchema>) => {
    onAddDocument(data);
    form.reset();
    onOpenChange(false);
  };
  
  const handleUserChange = (employeeName: string) => {
    form.setValue('uploadedBy', employeeName);
    const employee = employees?.find(e => e.name === employeeName);
    if(employee) {
        form.setValue('employeeId', employee.id);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Documento</DialogTitle>
          <DialogDescription>
            Completa la información del documento a subir.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Contrato_final.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="uploadedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subido por</FormLabel>
                  <Select onValueChange={handleUserChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un empleado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map(employee => (
                        <SelectItem key={employee.id} value={employee.name}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
