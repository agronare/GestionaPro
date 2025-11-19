'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { format, parse } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type Employee = {
    id: string;
    name: string;
    avatarUrl: string;
    joinDate: string;
    [key: string]: any;
};

export function RecentActivity() {
  const firestore = useFirestore();
  const { user } = useUser();
  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'employees'), orderBy('joinDate', 'desc'), limit(4))
  },
    [firestore, user]
  );
  const { data: employees, isLoading } = useCollection<Employee>(employeesQuery);

  return (
    <div className="space-y-6">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        ))
      ) : employees?.map(employee => {
        let joinDateObj;
        try {
            joinDateObj = parse(employee.joinDate, 'MMM d, yyyy', new Date());
             if (isNaN(joinDateObj.getTime())) {
                joinDateObj = new Date(employee.joinDate);
            }
        } catch (e) {
            joinDateObj = new Date();
        }
       
        return (
            <div key={employee.id} className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
                <AvatarImage src={employee.avatarUrl} alt={`Avatar de ${employee.name}`} data-ai-hint="person face" />
                <AvatarFallback>{employee.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                Nuevo empleado: {' '}
                <span className="text-muted-foreground font-normal">
                    {employee.name}
                </span>
                </p>
                <p className="text-sm text-muted-foreground">
                    {`Se unió ${!isNaN(joinDateObj.getTime()) ? formatDistanceToNow(joinDateObj, { addSuffix: true, locale: es }) : 'recientemente'}`}
                </p>
            </div>
            </div>
        );
      })}
       <Button variant="outline" className="w-full">
        Ver toda la actividad <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
