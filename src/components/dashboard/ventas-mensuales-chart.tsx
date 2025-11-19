'use client';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  ventas: {
    label: 'Ventas',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

type VentasMensualesChartProps = {
    data: any[];
    isLoading?: boolean;
}

export function VentasMensualesChart({ data, isLoading }: VentasMensualesChartProps) {
    if (isLoading) {
        return <Skeleton className="h-[250px] w-full" />
    }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <AreaChart 
        accessibilityLayer 
        data={data}
        margin={{ left: 12, right: 12 }}
       >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={value => value.slice(0, 3)}
        />
        <YAxis
            tickFormatter={(value) => `$${Number(value)/1000}k`}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            width={80}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillVentas" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-ventas)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-ventas)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area dataKey="ventas" type="natural" fill="url(#fillVentas)" fillOpacity={0.4} stroke="var(--color-ventas)" stackId="a" />
      </AreaChart>
    </ChartContainer>
  );
}
