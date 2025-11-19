'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, HandCoins } from "lucide-react";
import { useRouter } from 'next/navigation';
import { CreditSalesTab } from "@/components/crm/credit-sales-tab";
import { AbonosTab } from "@/components/crm/abonos-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { AddSaleDialog } from "@/components/erp/add-sale-dialog";

export default function CrmSalesPage() {
    const router = useRouter();
    const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);

    return (
        <>
            <PageHeader
                title="Créditos y Cobranza"
                description="Administre las ventas a crédito, registre pagos y de seguimiento a la cartera de clientes."
            >
                <div className="flex gap-2">
                    <Button onClick={() => setIsSaleDialogOpen(true)}>
                        <PlusCircle className="mr-2" />
                        Registrar Venta a Crédito
                    </Button>
                     <Button onClick={() => router.push('/erp/payments')}>
                        <HandCoins className="mr-2 h-4 w-4" />
                        Ir a Registrar Abonos
                    </Button>
                </div>
            </PageHeader>
            
            <Tabs defaultValue="credit-sales" className="mt-6">
                <TabsList>
                    <TabsTrigger value="credit-sales">Ventas a Crédito</TabsTrigger>
                    <TabsTrigger value="payments">Registro de Abonos</TabsTrigger>
                </TabsList>
                <TabsContent value="credit-sales">
                    <CreditSalesTab />
                </TabsContent>
                <TabsContent value="payments">
                    <AbonosTab />
                </TabsContent>
            </Tabs>
            
            {/* El diálogo de venta se reutiliza aquí pero podría tener una versión específica para crédito si es necesario */}
            <AddSaleDialog 
                isOpen={isSaleDialogOpen}
                onOpenChange={setIsSaleDialogOpen}
                onAddSale={(branchId: string, saleData: any) => {
                    // La lógica para añadir la venta a crédito se maneja dentro del diálogo
                    // o se podría pasar una función específica aquí.
                    console.log("Nueva venta a crédito registrada:", saleData);
                }}
            />
        </>
    );
}
