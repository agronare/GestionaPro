'use client';
import { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { EmployeeTable } from '@/components/employees/employee-table';
import { AddEmployeeDialog } from '@/components/employees/add-employee-dialog';
import type { Employee } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function EmployeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  
  const { user, isUserLoading } = useUser();
  
  const employeesCollection = useMemoFirebase(() => {
    // Only create the query if the user and firestore are available
    if (!user || !firestore) return null;
    return collection(firestore, 'employees');
  }, [firestore, user]);

  const { data: employees, isLoading: areEmployeesLoading } = useCollection<Employee>(employeesCollection);

  const handleAddEmployee = (
    newEmployeeData: Omit<Employee, 'id' | 'avatarUrl' | 'status' | 'joinDate'> & { hireDate: Date }
  ) => {
    if (!firestore) return;
    const id = newEmployeeData.employeeNumber || `EMP-${Date.now()}`;
    const employeeDocRef = doc(firestore, 'employees', id);

    const newEmployee: Partial<Employee> = {
      ...newEmployeeData,
      id: id,
      avatarUrl: PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl,
      status: 'Active',
      joinDate: format(newEmployeeData.hireDate, 'PP'),
    };
    
    // Remove hireDate as it's a Date object and not serializable for Firestore directly in this structure.
    delete (newEmployee as any).hireDate;

    setDocumentNonBlocking(employeeDocRef, newEmployee, { merge: true });
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Combine both loading states: auth check and data fetching
  const isLoading = isUserLoading || areEmployeesLoading;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Empleados
        </h1>
        <p className="text-muted-foreground">
          Administra la información, el estado y los perfiles de todo el personal.
        </p>
      </div>

       <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, puesto..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Empleado
        </Button>
      </div>
      
      <div className="flex-1 p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
        <EmployeeTable employees={filteredEmployees} isLoading={isLoading} />
      </div>
      <AddEmployeeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddEmployee={handleAddEmployee}
      />
    </div>
  );
}
    