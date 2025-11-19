'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, BarChart, Loader2, FileText } from 'lucide-react';
import { VentasMensualesChart } from '@/components/dashboard/ventas-mensuales-chart';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('');
  const [grouping, setGrouping] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleGenerateReport = () => {
    if (!reportType || !grouping || !startDate || !endDate) {
      alert('Por favor, selecciona todos los filtros antes de generar el reporte.');
      return;
    }
    setIsLoading(true);
    setShowReport(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowReport(true);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Reportes
        </h1>
        <p className="text-muted-foreground">
          Constructor de reportes personalizados para analizar tus operaciones
          desde cualquier ángulo.
        </p>
      </div>

      <Tabs defaultValue="generator">
        <TabsList>
          <TabsTrigger value="inventory-age">Antigüedad de Inventario</TabsTrigger>
          <TabsTrigger value="generator">Generador de Reportes</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory-age">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Próximamente: Reporte de Antigüedad de Inventario.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="generator">
          <Card className="border-none shadow-none p-0">
            <CardContent className="p-0">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <Filter className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">
                      Paso 1: Seleccionar la Fuente de Datos
                    </h3>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Seleccionar fuente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Ventas</SelectItem>
                        <SelectItem value="purchases">Compras</SelectItem>
                        <SelectItem value="inventory">Inventario</SelectItem>
                        <SelectItem value="clients">Clientes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Filter className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">
                      Paso 2: Seleccionar la Agrupación
                    </h3>
                    <Select value={grouping} onValueChange={setGrouping}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Seleccionar agrupación..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="by-day">Por Día</SelectItem>
                        <SelectItem value="by-week">Por Semana</SelectItem>
                        <SelectItem value="by-month">Por Mes</SelectItem>
                        <SelectItem value="by-client">Por Cliente</SelectItem>
                        <SelectItem value="by-product">Por Producto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Filter className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">
                      Paso 3: Seleccionar Rango de Fechas y Generar
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <BarChart className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Generando...' : 'Generar Reporte'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {showReport && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Reporte de {reportType}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Agrupado por: {grouping}. Periodo: {startDate} al {endDate}.
                        </p>
                    </div>
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar PDF
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <VentasMensualesChart data={[]} isLoading={isLoading} />
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
