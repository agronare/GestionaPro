'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  quantity: {
    label: 'Cantidad Vendida',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

type TopProductsChartProps = {
    data: any[];
    isLoading?: boolean;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
    if (isLoading) {
        return <Skeleton className="h-[200px] w-full" />
    }
    
    if (data.length === 0) {
        return <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No hay datos de ventas.</div>
    }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 10, right: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
          width={100}
        />
        <XAxis dataKey="quantity" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar
          dataKey="quantity"
          fill="var(--color-quantity)"
          radius={4}
          layout="vertical"
        />
      </BarChart>
    </ChartContainer>
  );
}
