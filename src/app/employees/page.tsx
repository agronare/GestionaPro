'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { EmployeeTable } from '@/components/employees/employee-table';
import { AddEmployeeDialog } from '@/components/employees/add-employee-dialog';
import type { Employee } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function EmployeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const employeesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'employees');
  }, [firestore, user]);

  const { data: employees, isLoading } = useCollection<Employee>(employeesCollection);

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


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          RH
        </h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Empleado
        </Button>
      </div>
      <div className="p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
        <EmployeeTable employees={employees} isLoading={isLoading} />
      </div>
      <AddEmployeeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddEmployee={handleAddEmployee}
      />
    </div>
  );
}
