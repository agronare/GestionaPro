'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddSampleDialog } from '@/components/lims/add-sample-dialog';
import { format } from 'date-fns';
import { FlaskConical } from 'lucide-react';

export type Sample = {
  id: string;
  lotNumber: string;
  product: string;
  samplingDate: string;
  status: 'Pendiente' | 'En Análisis' | 'Completado' | 'Rechazado';
};

const initialSamples: Sample[] = [];

export default function LimsPage() {
  const [samples, setSamples] = useState<Sample[]>(initialSamples);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddSample = (data: any) => {
    const newSample: Sample = {
      id: `SAMPLE-${Date.now()}`,
      lotNumber: data.lotNumber,
      product: data.product,
      samplingDate: format(data.samplingDate, 'dd/MM/yyyy'),
      status: data.status,
    };
    setSamples(prev => [newSample, ...prev]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <FlaskConical className="h-6 w-6" />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
            LIMS
            </h1>
            <p className="text-muted-foreground">
            Sistema de gestión de información de laboratorio. Monitorea muestras y resultados en tiempo real.
            </p>
        </div>
      </div>

       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4 text-sm">
            <Button variant="link" className="text-base p-0 h-auto text-primary">Muestras <Badge className='ml-2' variant="destructive">15</Badge></Button>
            <Button variant="link" className="text-base p-0 h-auto text-muted-foreground">Resultados de Análisis <Badge className='ml-2'>3</Badge></Button>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Muestra
            </Button>
            <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
            </Button>
             <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Exportar Datos
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
                <CardTitle>Muestras de Laboratorio</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No hay muestras registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  samples.map(sample => (
                    <TableRow key={sample.id}>
                      <TableCell>{sample.samplingDate}</TableCell>
                      <TableCell className="font-medium">{sample.lotNumber}</TableCell>
                      <TableCell>{sample.product}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sample.status === 'Completado' ? 'secondary' : 'outline'}
                          className={cn(
                            sample.status === 'Pendiente' && 'bg-yellow-100 text-yellow-700',
                            sample.status === 'En Análisis' && 'bg-blue-100 text-blue-700',
                            sample.status === 'Completado' && 'bg-green-100 text-green-700',
                            sample.status === 'Rechazado' && 'bg-red-100 text-red-700'
                          )}
                        >
                          {sample.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <AddSampleDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleAddSample}
      />
    </div>
  );
}
