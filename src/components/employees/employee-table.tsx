import type { Employee } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

type EmployeeTableProps = {
  employees: Employee[] | null;
  isLoading: boolean;
};

export function EmployeeTable({ employees, isLoading }: EmployeeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Avatar</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead className="hidden md:table-cell">Rol</TableHead>
          <TableHead className="hidden md:table-cell">Estado</TableHead>
          <TableHead className="hidden lg:table-cell">Fecha de Ingreso</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-10 w-10 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48 mt-1" />
              </TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
            </TableRow>
          ))
        ) : !employees || employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No se encontraron empleados.
            </TableCell>
          </TableRow>
        ) : (
          employees.map(employee => (
            <TableRow key={employee.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="person face" />
                  <AvatarFallback>
                    {employee.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <div className="font-medium">{employee.name}</div>
                <div className="text-sm text-muted-foreground">
                  {employee.email}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{employee.role}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge
                  variant={employee.status === 'Active' ? 'default' : 'secondary'}
                  className={cn(employee.status === 'Active' && 'bg-green-500/20 text-green-700 border-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/10',
                                 employee.status === 'Inactive' && 'bg-red-500/20 text-red-700 border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/10'
                  )}
                >
                  {employee.status === 'Active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{employee.joinDate}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
    