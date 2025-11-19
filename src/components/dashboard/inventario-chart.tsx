'use client';

import { Pie, PieChart, Cell, Tooltip } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '@/utils/formatters';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

type InventarioChartProps = {
  data: { [branchName: string]: number };
  isLoading?: boolean;
}

export function InventarioChart({ data, isLoading }: InventarioChartProps) {

  const chartData = Object.keys(data).map(key => ({
    name: key,
    value: data[key],
    fill: `var(--color-${key})`
  }));
  
  const chartConfig: ChartConfig = Object.keys(data).reduce((acc, key, index) => {
    acc[key] = {
      label: key,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />
  }
  
  if (chartData.length === 0) {
      return <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No hay datos de inventario.</div>
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <PieChart>
        <Tooltip
          content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number)} />}
        />
        <Pie 
            data={chartData} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            innerRadius={60}
            outerRadius={80}
            strokeWidth={2}
         >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color} />
            ))}
        </Pie>
         <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-lg font-bold"
        >
          {formatCurrency(totalValue)}
        </text>
         <text
          x="50%"
          y="50%"
          dy="1.2em"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-xs"
        >
          Total
        </text>
      </PieChart>
    </ChartContainer>
  );
}
