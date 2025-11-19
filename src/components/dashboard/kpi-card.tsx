import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string;
  change?: string;
  changeDescription?: string;
  Icon: LucideIcon;
  color?: string;
  isLoading?: boolean;
};

export const KpiCard = memo(({
  title,
  value,
  change,
  changeDescription,
  Icon,
  color,
  isLoading,
}: KpiCardProps) => {
  const isPositive = change && parseFloat(change) >= 0;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex items-center justify-center h-8 w-8 rounded-full", color)}>
            <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className='space-y-2'>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        ) : (
            <>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <p className={cn("text-xs flex items-center gap-1", isPositive ? "text-green-600" : "text-red-600")}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {change} 
                        {changeDescription && <span className="text-muted-foreground ml-1">{changeDescription}</span>}
                    </p>
                )}
            </>
        )}
      </CardContent>
    </Card>
  );
});

KpiCard.displayName = 'KpiCard';
