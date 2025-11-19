'use client';
import { useMemo } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Percent,
  BarChart,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { VentasMensualesChart } from '@/components/dashboard/ventas-mensuales-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TaskSuggester } from '@/components/ai/task-suggester';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Sale, InventoryItem, Product } from '@/lib/types';
import type { Client } from '@/app/crm/clients/page';
import { subDays, format } from 'date-fns';
import { InventarioChart } from '@/components/dashboard/inventario-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const salesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'sales');
  }, [firestore, user]);
  const { data: sales, isLoading: salesLoading } = useCollection<Sale & { status?: string }>(salesCollection);

  const clientsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'clients');
  }, [firestore, user]);
  const { data: clients, isLoading: clientsLoading } = useCollection<Client & { createdAt?: Timestamp }>(clientsCollection);
  
  const employeesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'employees');
  }, [firestore, user]);
  const { data: employees, isLoading: employeesLoading } = useCollection(employeesCollection);
  
  const inventoryCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'inventory');
  }, [firestore, user]);
  const { data: inventory, isLoading: inventoryLoading } = useCollection<InventoryItem>(inventoryCollection);
  
  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'products');
  }, [firestore, user]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);


  const { 
    totalVentas, 
    nuevosClientes, 
    pedidosPendientes,
    ventasChange,
    clientesChange,
    inventoryValue,
    grossMargin
  } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const recentSales = sales?.filter(sale => {
      const saleDate = sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date);
      return saleDate >= thirtyDaysAgo && sale.status !== 'Cancelada';
    }) || [];
    
    const recentClients = clients?.filter(client => 
        client.createdAt && client.createdAt.toDate() >= thirtyDaysAgo
    ) || [];
    
    const previousSales = sales?.filter(sale => {
       const saleDate = sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date);
      return saleDate >= sixtyDaysAgo && saleDate < thirtyDaysAgo && sale.status !== 'Cancelada';
    }) || [];

    const previousClients = clients?.filter(client => {
        const clientDate = client.createdAt?.toDate();
        return clientDate && clientDate >= sixtyDaysAgo && clientDate < thirtyDaysAgo;
    }) || [];

    const totalVentas = recentSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalVentasAnterior = previousSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalCostOfGoods = recentSales.reduce((acc, sale) => acc + (sale.totalCost || 0), 0);
    
    const nuevosClientes = recentClients.length;
    const nuevosClientesAnterior = previousClients.length;

    const ventasChange = totalVentasAnterior > 0 
        ? ((totalVentas - totalVentasAnterior) / totalVentasAnterior) * 100
        : totalVentas > 0 ? 100 : 0;

    const clientesChange = nuevosClientesAnterior > 0
        ? ((nuevosClientes - nuevosClientesAnterior) / nuevosClientesAnterior) * 100
        : nuevosClientes > 0 ? 100 : 0;

    const pedidosPendientes = sales?.filter(sale => sale.status === 'Pendiente').length || 0;
    
    const inventoryValue = inventory?.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) || 0;
    
    const grossMargin = totalVentas > 0 ? ((totalVentas - totalCostOfGoods) / totalVentas) * 100 : 0;

    return { totalVentas, nuevosClientes, pedidosPendientes, ventasChange, clientesChange, inventoryValue, grossMargin };
  }, [sales, clients, inventory]);
  
  const salesByMonth = useMemo(() => {
    const monthData: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = format(d, 'MMM');
        monthData[monthName] = 0;
    }

    sales?.forEach(sale => {
      if (sale.status === 'Cancelada') return;
      try {
        const saleDate = sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date);
        const monthName = format(saleDate, 'MMM');
        if (monthData.hasOwnProperty(monthName)) {
            monthData[monthName] += sale.total;
        }
      } catch(e) {
        console.error("Invalid date format for sale:", sale.id, sale.date);
      }
    });

    return Object.keys(monthData).map(name => ({
        name,
        ventas: monthData[name],
    }));

  }, [sales]);

  const topSoldProducts = useMemo(() => {
    if (!sales) return [];

    const productSales = sales
      .filter(sale => sale.status !== 'Cancelada')
      .flatMap(sale => sale.items)
      .reduce((acc, item) => {
        if (!acc[item.productName]) {
          acc[item.productName] = 0;
        }
        acc[item.productName] += item.quantity;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  }, [sales]);

  const inventoryByBranch = useMemo<Record<string, number>>(() => {
    if (!inventory) return {};
    
    return inventory.reduce((acc, item) => {
        const branchName = item.branchId;
        if (!acc[branchName]) {
            acc[branchName] = 0;
        }
        acc[branchName] += item.quantity * item.unitPrice;
        return acc;
    }, {} as Record<string, number>);
  }, [inventory]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bienvenido de nuevo, aquí está un resumen de tu negocio.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Ventas Totales (30d)"
          value={`$${totalVentas.toLocaleString('es-MX', {maximumFractionDigits: 0})}`}
          Icon={DollarSign}
          change={`${ventasChange >= 0 ? '+' : ''}${ventasChange.toFixed(1)}%`}
          changeDescription="vs mes anterior"
          isLoading={salesLoading}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
        />
        <KpiCard
          title="Pedidos Pendientes"
          value={pedidosPendientes.toString()}
          Icon={ShoppingCart}
          isLoading={salesLoading}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
        />
        <KpiCard
          title="Nuevos Clientes (30d)"
          value={`+${nuevosClientes.toString()}`}
          Icon={Users}
          change={`${clientesChange >= 0 ? '+' : ''}${clientesChange.toFixed(1)}%`}
          changeDescription="vs mes anterior"
          isLoading={clientsLoading}
           color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
        />
        <KpiCard
          title="Empleados Activos"
          value={employees?.length.toString() || '0'}
          Icon={Activity}
          isLoading={employeesLoading}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
        />
         <KpiCard
          title="Margen Bruto (30d)"
          value={`${grossMargin.toFixed(1)}%`}
          Icon={Percent}
          isLoading={salesLoading}
           color="bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300"
        />
        <KpiCard
          title="Valor Inventario"
          value={`$${inventoryValue.toLocaleString('es-MX', {maximumFractionDigits: 0})}`}
          Icon={Warehouse}
          isLoading={inventoryLoading}
          color="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/50 dark:text-fuchsia-300"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <VentasMensualesChart data={salesByMonth} isLoading={salesLoading} />
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 Productos Vendidos (30d)</CardTitle>
                </CardHeader>
                <CardContent>
                    <TopProductsChart data={topSoldProducts} isLoading={salesLoading} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Distribución de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                    <InventarioChart data={inventoryByBranch} isLoading={inventoryLoading} />
                </CardContent>
            </Card>
        </div>
      </div>
       <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
                <RecentActivity />
            </CardContent>
        </Card>
        <div className="lg:col-span-2">
            <TaskSuggester />
        </div>
      </div>
    </div>
  );
}
