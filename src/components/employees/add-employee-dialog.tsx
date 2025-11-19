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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Employee } from '@/lib/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from '../ui/switch';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Branch } from '@/app/hr/branches/page';


type AddEmployeeDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddEmployee: (
    data: Omit<Employee, 'id' | 'avatarUrl' | 'status' | 'joinDate'> & { hireDate: Date }
  ) => void;
};

const employeeSchema = z.object({
  name: z.string().min(1, 'El nombre completo es requerido.'),
  employeeNumber: z.string().optional(),
  position: z.string().min(1, 'El puesto es requerido.'),
  department: z.string().min(1, 'El departamento es requerido.'),
  email: z.string().email('El correo electrónico no es válido.'),
  hireDate: z.date({ required_error: 'La fecha de contratación es requerida.' }),
  baseSalary: z.coerce.number().min(0, 'El salario debe ser un número positivo.'),
  role: z.enum(['Admin', 'Manager', 'Employee']),
  assignedBranch: z.string().min(1, 'Debes asignar una sucursal.'),
  hasSystemAccess: z.boolean().default(false),
});

export function AddEmployeeDialog({
  isOpen,
  onOpenChange,
  onAddEmployee,
}: AddEmployeeDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const branchesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'branches');
  }, [firestore, user]);

  const { data: branches, isLoading: areBranchesLoading } = useCollection<Branch>(branchesCollection);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      employeeNumber: '',
      position: '',
      department: '',
      email: '',
      hireDate: new Date(),
      baseSalary: 0,
      role: 'Employee',
      assignedBranch: '',
      hasSystemAccess: false,
    },
  });

  const onSubmit = (data: z.infer<typeof employeeSchema>) => {
    onAddEmployee(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="employeeNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número de Empleado</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. 1025" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Puesto</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Gerente de Ventas" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Ventas" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="juan.perez@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                 <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Contratación</FormLabel>
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
                    name="baseSalary"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Salario Base Mensual</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div>
                <h3 className="text-base font-semibold mb-4">Permisos y Acceso</h3>
                <div className="space-y-4">
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Rol en el sistema</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Employee">Empleado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="assignedBranch"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sucursal Asignada</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={areBranchesLoading || !branches}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={areBranchesLoading ? "Cargando..." : "Seleccionar..."} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                     {branches?.map(branch => (
                                        <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                                     ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                      <FormField
                        control={form.control}
                        name="hasSystemAccess"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                    Acceso al Sistema
                                    </FormLabel>
                                    <FormDescription>
                                    Crear una cuenta para que este empleado inicie sesión.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                </div>
             </div>


            <DialogFooter className='pt-8'>
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
