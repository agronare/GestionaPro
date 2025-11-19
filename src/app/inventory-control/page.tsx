'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import { PhysicalCountTab } from '@/components/inventory-control/physical-count-tab';
import { ReceptionTab } from '@/components/inventory-control/reception-tab';
import { Suspense } from 'react';


export default function InventoryControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Control de Inventario
        </h1>
        <p className="text-muted-foreground">
          Valida recepciones de compra y realiza conteos físicos del inventario.
        </p>
      </div>

      <Tabs defaultValue="reception">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="reception">Recepción de Compras</TabsTrigger>
          <TabsTrigger value="physical-count">Conteo Físico</TabsTrigger>
        </TabsList>
        <TabsContent value="reception">
          <Suspense fallback={<div>Cargando...</div>}>
            <ReceptionTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="physical-count">
           <PhysicalCountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
