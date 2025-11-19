
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLogistics } from '../context';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';

export type LogisticsExpense = {
  id: string;
  date: string;
  concept: 'Combustible' | 'Casetas' | 'Viáticos' | 'Mantenimiento Menor' | 'Otro';
  amount: number;
  vehicleId: string;
  tripId: string;
  tripType: 'delivery' | 'pickup';
  notes?: string;
};

export default function ExpensesPage() {
  const { expenses, vehicles, isLoading } = useLogistics();

  const getVehicleName = (vehicleId: string) => {
    return vehicles?.find(v => v.id === vehicleId)?.name || 'Desconocido';
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Gastos de Logística</h1>
        <p className="text-muted-foreground">Consulta y analiza los gastos operativos de tu flota.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Historial de Gastos</CardTitle>
            <CardDescription>Listado de todos los gastos registrados en las operaciones.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Viaje ID</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : expenses?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay gastos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses?.map(expense => (
                    <TableRow key={expense.id}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell><Badge variant="outline">{expense.concept}</Badge></TableCell>
                        <TableCell>{getVehicleName(expense.vehicleId)}</TableCell>
                        <TableCell className="font-mono text-xs">{expense.tripId.substring(0, 10)}...</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    