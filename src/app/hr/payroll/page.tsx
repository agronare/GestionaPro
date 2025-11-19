'use client';
import { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddPayrollDialog } from '@/components/hr/add-payroll-dialog';
import type { PayrollRun } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function PayrollPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const payrollsCollection = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'payrolls');
    }, [firestore, user]);
    const { data: payrollRuns, isLoading } = useCollection<PayrollRun>(payrollsCollection);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAddPayroll = (data: any) => {
        if (!payrollsCollection) return;
        const newRun: Omit<PayrollRun, 'id'> = {
            type: data.type,
            period: `Nómina ${data.type} - ${format(data.startDate, 'dd MMM', { locale: es })}`,
            startDate: format(data.startDate, 'yyyy-MM-dd'),
            endDate: format(data.endDate, 'yyyy-MM-dd'),
            paymentDate: format(data.paymentDate, 'yyyy-MM-dd'),
            employeeCount: 5, // Mock data
            totalAmount: 41350.00, // Mock data
            status: 'En Borrador',
        };
        addDocumentNonBlocking(payrollsCollection, newRun);
    };

  return (
    <div className="flex flex-col gap-6">
       <div className='flex items-center justify-between'>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
                Nómina
                </h1>
                <p className="text-muted-foreground">
                Procesa, gestiona y consulta los pagos de nómina.
                </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className='h-4 w-4 mr-2' />
                Calcular Nueva Nómina
            </Button>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Periodos de Nómina</CardTitle>
            <CardDescription>Aquí puedes ver los periodos de nómina calculados.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className='rounded-lg border'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Periodo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>No. Empleados</TableHead>
                            <TableHead>Total a Pagar</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className='text-right'>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell></TableRow>
                        ) : payrollRuns?.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay nóminas calculadas.
                                </TableCell>
                            </TableRow>
                        ) : payrollRuns?.map(run => (
                            <TableRow key={run.id}>
                                <TableCell className='font-medium'>{run.period}</TableCell>
                                <TableCell>{run.type}</TableCell>
                                <TableCell>{run.employeeCount}</TableCell>
                                <TableCell>MXN {run.totalAmount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</TableCell>
                                <TableCell>
                                    <Badge variant={run.status === 'Pagada' ? 'secondary' : 'outline'} className={cn(
                                        run.status === 'Pagada' && 'bg-green-100 text-green-700',
                                        run.status === 'En Borrador' && 'bg-yellow-100 text-yellow-700',
                                    )}>
                                        {run.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className='text-right'>
                                     <Button variant="outline" size="sm">Ver Detalles</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      <AddPayrollDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleAddPayroll}
      />
    </div>
  );
}
