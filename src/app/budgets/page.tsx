'use client';
import { useState, useMemo, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Save, GitCompare, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

type FinancialInputProps = {
    label: string;
    value: number;
    onChange: (value: number) => void;
};

const FinancialInput = memo(({ label, value, onChange }: FinancialInputProps) => (
    <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input 
                type="number"
                className="pl-6 text-right"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            />
        </div>
    </div>
));
FinancialInput.displayName = 'FinancialInput';

type SummaryCardProps = {
    title: string;
    value: number;
    isPercentage?: boolean;
    status: 'Positivo' | 'Rentable' | 'Crítico' | 'Neutral';
};

const SummaryCard = memo(({ title, value, isPercentage, status }: SummaryCardProps) => {
    const statusInfo = {
        Positivo: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
        Rentable: { icon: TrendingUp, color: 'text-green-600 bg-green-100' },
        Crítico: { icon: AlertCircle, color: 'text-red-600 bg-red-100' },
        Neutral: { icon: TrendingDown, color: 'text-amber-600 bg-amber-100' },
    };
    const Icon = statusInfo[status].icon;
    
    const cardColor = {
        Positivo: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        Rentable: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        Crítico: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        Neutral: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    }

    return (
        <Card className={cardColor[status]}>
            <CardHeader>
                <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">
                    {isPercentage 
                        ? `${value.toFixed(2)}%` 
                        : `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
                <div className="flex items-center gap-1 text-xs mt-1">
                    <Icon className={cn("h-3 w-3", statusInfo[status].color.split(' ')[0])} />
                    <span className={statusInfo[status].color.split(' ')[0]}>{status}</span>
                </div>
            </CardContent>
        </Card>
    );
});
SummaryCard.displayName = 'SummaryCard';


export default function BudgetsPage() {
    const [ventasNetas, setVentasNetas] = useState(0);
    const [costoVentas, setCostoVentas] = useState(0);
    const [gastosOperacionales, setGastosOperacionales] = useState(0);
    const [gastosFinancieros, setGastosFinancieros] = useState(0);
    const [impuestos, setImpuestos] = useState(0);

    const { utilidadBruta, utilidadNeta, margenUtilidad } = useMemo(() => {
        const utilidadBruta = ventasNetas - costoVentas;
        const utilidadNeta = utilidadBruta - gastosOperacionales - gastosFinancieros - impuestos;
        const margenUtilidad = ventasNetas > 0 ? (utilidadNeta / ventasNetas) * 100 : 0;
        return { utilidadBruta, utilidadNeta, margenUtilidad };
    }, [ventasNetas, costoVentas, gastosOperacionales, gastosFinancieros, impuestos]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
                        <span className='text-3xl'>💰</span> Presupuesto Anual
                    </h1>
                    <p className="text-muted-foreground">Planifica y compara tus ingresos y gastos para optimizar la rentabilidad.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Save className="mr-2 h-4 w-4" />Guardar Presupuesto</Button>
                    <Button><GitCompare className="mr-2 h-4 w-4" />Comparar con Reales</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ingresa tu Presupuesto Anual</CardTitle>
                    <CardDescription>Los cálculos se actualizan automáticamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                             <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                🧾 Ingresos Presupuestados
                            </h3>
                            <FinancialInput label="Ventas Netas" value={ventasNetas} onChange={setVentasNetas} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-foreground">Gastos Presupuestados</h3>
                            <FinancialInput label="Costo de Ventas" value={costoVentas} onChange={setCostoVentas} />
                            <FinancialInput label="Gastos Operacionales" value={gastosOperacionales} onChange={setGastosOperacionales} />
                            <FinancialInput label="Gastos Financieros" value={gastosFinancieros} onChange={setGastosFinancieros} />
                            <FinancialInput label="Impuestos" value={impuestos} onChange={setImpuestos} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-lg font-semibold mb-4">Resumen Financiero</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <SummaryCard 
                        title="Utilidad Bruta" 
                        value={utilidadBruta} 
                        status={utilidadBruta >= 0 ? 'Positivo' : 'Crítico'} 
                    />
                     <SummaryCard 
                        title="Utilidad Neta" 
                        value={utilidadNeta} 
                        status={utilidadNeta >= 0 ? 'Rentable' : 'Crítico'}
                    />
                    <SummaryCard 
                        title="Margen de Utilidad" 
                        value={margenUtilidad} 
                        isPercentage
                        status={margenUtilidad > 0 ? 'Rentable' : 'Crítico'}
                    />
                </div>
            </div>
        </div>
    );
}
