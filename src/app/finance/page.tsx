'use client';
import { useState, useMemo, useTransition, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  RefreshCw,
  Download,
  Calculator,
  Save,
  Landmark,
  FileText,
  DollarSign,
  Banknote,
  Receipt,
  Building,
  BookUser,
  Users,
  TrendingUp,
  BarChart,
  Scale,
  TrendingDown,
  Coins,
  Wallet,
  Calendar,
  HandCoins,
  Activity,
  Briefcase,
  Recycle,
  Droplets,
  LineChart,
  Percent,
  Wand2,
  Loader2,
  Lightbulb,
  CheckCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { analyzeFinancials, type AnalyzeFinancialsOutput } from '@/ai/flows/analyze-financials';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Client, Supplier, InventoryItem, FixedAsset, Sale } from '@/lib/types';


type AccountEntryProps = {
  label: string;
  value: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isEditable?: boolean;
  onValueChange?: (value: number) => void;
};

const AccountEntry = ({ label, value, isSubtotal = false, isTotal = false, isEditable = false, onValueChange }: AccountEntryProps) => {
    const [displayValue, setDisplayValue] = useState(value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    useEffect(() => {
        setDisplayValue(value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }, [value]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value.replace(/,/g, ''));
        if (!isNaN(newValue)) {
            onValueChange?.(newValue);
            setDisplayValue(newValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
            setDisplayValue(value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    };
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.value = value.toString();
        e.target.select();
    };

    return (
        <div className={cn(
            "flex justify-between items-center text-sm py-2",
            !isTotal && "border-b border-border/50",
            isSubtotal && 'font-semibold',
            isTotal && 'font-bold text-base pt-4'
        )}>
            <span>{label}</span>
            {isEditable ? (
                <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                        type="text"
                        className="pl-6 text-right h-8 bg-background"
                        value={displayValue}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={(e) => setDisplayValue(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    />
                </div>
            ) : (
                <div className='flex items-center bg-muted/50 rounded-md p-1 px-3 w-40 justify-end'>
                    <span className='text-muted-foreground text-xs mr-2'>$</span>
                    <span className="font-mono text-muted-foreground text-right">
                    {value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            )}
        </div>
    );
}


const RatioEntry = ({ label, value, isPercentage = false }: { label: string, value: number, isPercentage?: boolean}) => (
    <div className="flex justify-between text-sm py-1">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">
            {isPercentage ? `${value.toFixed(2)}%` : value.toFixed(2)}
        </span>
    </div>
);


const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType, title: string }) => (
    <div className="flex items-center gap-2 mt-4 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-primary text-xs uppercase tracking-wider">{title}</h4>
    </div>
);

export default function FinancePage() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    setIsClient(true);
    setLastUpdated(new Date());
  }, []);

  // --- Data fetching ---
  const { data: clients } = useCollection<Client>(useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]));
  const { data: suppliers } = useCollection<Supplier>(useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]));
  const { data: inventory } = useCollection<InventoryItem>(useMemoFirebase(() => firestore ? collection(firestore, 'inventory') : null, [firestore]));
  const { data: fixedAssets } = useCollection<FixedAsset>(useMemoFirebase(() => firestore ? collection(firestore, 'fixed_assets') : null, [firestore]));
  const { data: sales } = useCollection<Sale>(useMemoFirebase(() => firestore ? collection(firestore, 'sales') : null, [firestore]));
  
  // --- Real Data Calculation ---
  const realData = useMemo(() => {
    const cuentasPorCobrar = clients?.reduce((sum, client) => sum + (client.creditUsed || 0), 0) || 0;
    const inventarios = inventory?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    const propiedades = fixedAssets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;
    const depreciacion = fixedAssets?.reduce((sum, asset) => sum + (asset.monthlyDepreciation || 0), 0) || 0;
    const cuentasPorPagar = suppliers?.reduce((sum, supplier) => sum + (supplier.creditUsed || 0), 0) || 0;
    const ingresosVentas = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    const costoVentas = sales?.reduce((sum, sale) => sum + sale.totalCost, 0) || 0;
    return { cuentasPorCobrar, inventarios, propiedades, depreciacion, cuentasPorPagar, ingresosVentas, costoVentas };
  }, [clients, suppliers, inventory, fixedAssets, sales]);

  // --- Balance General State ---
  const [efectivo, setEfectivo] = useState(150000.00);
  const [bancos, setBancos] = useState(250000.00);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState(0);
  const [inventarios, setInventarios] = useState(0);
  const [otrosActivosCorrientes, setOtrosActivosCorrientes] = useState(12000.00);
  
  const [propiedades, setPropiedades] = useState(0);
  const [intangibles, setIntangibles] = useState(0);
  const [otrosActivosNoCorrientes, setOtrosActivosNoCorrientes] = useState(0);
  
  const [cuentasPorPagar, setCuentasPorPagar] = useState(0);
  const [prestamosCortoPlazo, setPrestamosCortoPlazo] = useState(50000.00);
  const [pasivosLaborales, setPasivosLaborales] = useState(0);
  const [otrosPasivosCorrientes, setOtrosPasivosCorrientes] = useState(0);
  const [deudaLargoPlazo, setDeudaLargoPlazo] = useState(200000.00);
  const [otrosPasivosNoCorrientes, setOtrosPasivosNoCorrientes] = useState(0);
  
  const [capitalSocial, setCapitalSocial] = useState(800000.00);
  const [reservas, setReservas] = useState(0);
  const [resultadosAcumulados, setResultadosAcumulados] = useState(50000.00);
  
  // --- Estado de Resultados State ---
  const [ingresosVentas, setIngresosVentas] = useState(0);
  const [costoVentas, setCostoVentas] = useState(0);
  const [gastosVenta, setGastosVenta] = useState(45000);
  const [gastosAdmin, setGastosAdmin] = useState(95000);
  const [otrosIngresos, setOtrosIngresos] = useState(5000.00);
  const [gastosFinancieros, setGastosFinancieros] = useState(12000.00);
  const [impuestosPorcentaje] = useState(0.30);
  
  // --- Flujo de Efectivo State ---
  const [depreciacion, setDepreciacion] = useState(0);
  const [cambioCuentasPorCobrar, setCambioCuentasPorCobrar] = useState(0);
  const [cambioInventarios, setCambioInventarios] = useState(0);
  const [cambioCuentasPorPagar, setCambioCuentasPorPagar] = useState(0);
  
  const [compraActivos, setCompraActivos] = useState(50000.00);
  const [ventaActivos, setVentaActivos] = useState(0);

  const [emisionDeuda, setEmisionDeuda] = useState(0);
  const [pagoDeuda, setPagoDeuda] = useState(20000.00);
  
  const recalculateData = () => {
    // Balance
    setCuentasPorCobrar(realData.cuentasPorCobrar);
    setInventarios(realData.inventarios);
    setPropiedades(realData.propiedades);
    setCuentasPorPagar(realData.cuentasPorPagar);
    // Estado de Resultados
    setIngresosVentas(realData.ingresosVentas);
    setCostoVentas(realData.costoVentas);
    // Flujo de Efectivo
    setDepreciacion(realData.depreciacion);
    setCambioCuentasPorCobrar(realData.cuentasPorCobrar);
    setCambioInventarios(realData.inventarios);
    setCambioCuentasPorPagar(realData.cuentasPorPagar);
  }
  
  useEffect(() => {
    recalculateData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realData]);
  
  // Estado de Resultados Calculations
  const utilidadBruta = ingresosVentas - costoVentas;
  const totalGastosOp = gastosVenta + gastosAdmin;
  const utilidadOperacion = utilidadBruta - totalGastosOp;
  const utilidadAntesImp = utilidadOperacion + otrosIngresos - gastosFinancieros;
  const impuestos = utilidadAntesImp > 0 ? utilidadAntesImp * impuestosPorcentaje : 0;
  const utilidadNeta = utilidadAntesImp - impuestos;

  // Balance General Calculations
  const totalActivoCorriente = efectivo + bancos + cuentasPorCobrar + inventarios + otrosActivosCorrientes;
  const totalActivoNoCorriente = propiedades + intangibles + otrosActivosNoCorrientes;
  const totalActivo = totalActivoCorriente + totalActivoNoCorriente;

  const totalPasivoCorriente = cuentasPorPagar + prestamosCortoPlazo + pasivosLaborales + otrosPasivosCorrientes;
  const totalPasivoNoCorriente = deudaLargoPlazo + otrosPasivosNoCorrientes;
  const totalPasivo = totalPasivoCorriente + totalPasivoNoCorriente;

  const totalPatrimonio = capitalSocial + reservas + resultadosAcumulados + utilidadNeta;
  const totalPasivoPatrimonio = totalPasivo + totalPatrimonio;
  const diferencia = totalActivo - totalPasivoPatrimonio;

  // Flujo de Efectivo Calculations
  const totalFlujoOperacion = utilidadNeta + depreciacion - cambioCuentasPorCobrar - cambioInventarios + cambioCuentasPorPagar;
  const totalFlujoInversion = ventaActivos - compraActivos;
  const totalFlujoFinanciacion = emisionDeuda - pagoDeuda;
  const cambioNetoEfectivo = totalFlujoOperacion + totalFlujoInversion + totalFlujoFinanciacion;

  // Ratios
  const ratioCorriente = totalPasivoCorriente > 0 ? totalActivoCorriente / totalPasivoCorriente : 0;
  const ratioRapido = totalPasivoCorriente > 0 ? (totalActivoCorriente - inventarios) / totalPasivoCorriente : 0;
  const ratioDeudaPatrimonio = totalPatrimonio > 0 ? totalPasivo / totalPatrimonio : 0;
  const apalancamiento = totalPatrimonio > 0 ? totalActivo / totalPatrimonio : 0;
  const margenBruto = ingresosVentas > 0 ? (utilidadBruta / ingresosVentas) * 100 : 0;
  const margenNeto = ingresosVentas > 0 ? (utilidadNeta / ingresosVentas) * 100 : 0;
  const roa = totalActivo > 0 ? (utilidadNeta / totalActivo) * 100 : 0;
  const roe = totalPatrimonio > 0 ? (utilidadNeta / totalPatrimonio) * 100 : 0;

  // AI Assistant State
  const [isPending, startTransition] = useTransition();
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeFinancialsOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const handleGetAnalysis = () => {
    startTransition(async () => {
        setAiAnalysis(null);
        setAiError(null);
        try {
            const result = await analyzeFinancials({
                incomeStatement: {
                    revenue: ingresosVentas,
                    cogs: costoVentas,
                    grossProfit: utilidadBruta,
                    operatingExpenses: totalGastosOp,
                    netIncome: utilidadNeta,
                },
                balanceSheet: {
                    totalAssets: totalActivo,
                    totalLiabilities: totalPasivo,
                    totalEquity: totalPatrimonio,
                }
            });
            setAiAnalysis(result);
        } catch (e) {
            console.error(e);
            setAiError("No se pudo obtener el análisis. Inténtalo de nuevo.");
        }
    });
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <BarChart className="h-7 w-7" /> Panel Financiero Inteligente
          </h1>
          {isClient && (
            <p className="text-muted-foreground">
                {lastUpdated ? `Datos actualizados al: ${lastUpdated.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}` : 'Cargando fecha...'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><RefreshCw className="mr-2"/>Actualizar</Button>
          <Button variant="outline"><Download className="mr-2"/>Exportar</Button>
        </div>
      </div>

       <Card className="bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                <CardTitle className="text-xl flex items-center gap-2"><Wand2/> Asistente de Análisis Financiero</CardTitle>
                <CardDescription>
                    Obtén un resumen ejecutivo y acciones recomendadas basadas en tus datos actuales.
                </CardDescription>
                </div>
                <Button size="sm" onClick={handleGetAnalysis} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Analizar Ahora'}
                </Button>
            </CardHeader>
            <CardContent>
                {isPending && (
                <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                )}
                {aiError && <p className="text-sm text-destructive">{aiError}</p>}
                {aiAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <h4 className='font-semibold'>Resumen Ejecutivo</h4>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                    </div>
                    <div className="space-y-2">
                         <h4 className='font-semibold'>Acciones Recomendadas</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            {aiAnalysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                        </ol>
                    </div>
                </div>
                )}
                {!isPending && !aiAnalysis && !aiError && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        Haz clic en "Analizar Ahora" para obtener insights de la IA.
                    </div>
                )}
            </CardContent>
        </Card>

      <Tabs defaultValue="balance">
        <TabsList>
          <TabsTrigger value="balance"><Scale className='mr-2'/>Balance General</TabsTrigger>
          <TabsTrigger value="income-statement"><FileText className='mr-2'/>Estado de Resultados</TabsTrigger>
          <TabsTrigger value="cash-flow"><Banknote className='mr-2'/>Flujo de Efectivo</TabsTrigger>
          <TabsTrigger value="ratios"><Percent className='mr-2'/>Análisis de Ratios</TabsTrigger>
          <TabsTrigger value="comparative" disabled>
            Comparativo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="balance" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                 <Scale className="h-6 w-6" />
                <div>
                    <CardTitle className="text-xl">Balance General</CardTitle>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={recalculateData}><Calculator className="mr-2"/>Recalcular con Datos Reales</Button>
                <Button><Save className="mr-2"/>Guardar</Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ACTIVO */}
              <div className="border rounded-lg p-4 bg-background">
                <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="text-blue-500" />ACTIVO</h3>
                
                <SectionTitle icon={Wallet} title="Activo Corriente" />
                <AccountEntry label="Efectivo" value={efectivo} onValueChange={setEfectivo} isEditable />
                <AccountEntry label="Bancos" value={bancos} onValueChange={setBancos} isEditable />
                <AccountEntry label="Cuentas por Cobrar" value={cuentasPorCobrar} onValueChange={setCuentasPorCobrar} isEditable />
                <AccountEntry label="Inventarios" value={inventarios} onValueChange={setInventarios} isEditable />
                <AccountEntry label="Otros Activos Corrientes" value={otrosActivosCorrientes} onValueChange={setOtrosActivosCorrientes} isEditable />
                
                <SectionTitle icon={Building} title="Activo No Corriente" />
                <AccountEntry label="Propiedades, Planta y Equipo" value={propiedades} onValueChange={setPropiedades} isEditable />
                <AccountEntry label="Intangibles" value={intangibles} onValueChange={setIntangibles} isEditable />
                <AccountEntry label="Otros Activos No Corrientes" value={otrosActivosNoCorrientes} onValueChange={setOtrosActivosNoCorrientes} isEditable />
                
                <AccountEntry label="Total Activo" value={totalActivo} isTotal/>
              </div>
              
              {/* PASIVO */}
              <div className="border rounded-lg p-4 bg-background">
                 <h3 className="font-bold text-lg flex items-center gap-2"><TrendingDown className="text-red-500" />PASIVO</h3>

                <SectionTitle icon={Receipt} title="Pasivo Corriente" />
                <AccountEntry label="Cuentas por Pagar" value={cuentasPorPagar} onValueChange={setCuentasPorPagar} isEditable />
                <AccountEntry label="Préstamos a Corto Plazo" value={prestamosCortoPlazo} onValueChange={setPrestamosCortoPlazo} isEditable />
                <AccountEntry label="Pasivos Laborales" value={pasivosLaborales} onValueChange={setPasivosLaborales} isEditable />
                <AccountEntry label="Otros Pasivos Corrientes" value={otrosPasivosCorrientes} onValueChange={setOtrosPasivosCorrientes} isEditable />

                <SectionTitle icon={Calendar} title="Pasivo No Corriente" />
                <AccountEntry label="Deuda a Largo Plazo" value={deudaLargoPlazo} onValueChange={setDeudaLargoPlazo} isEditable />
                <AccountEntry label="Otros Pasivos No Corrientes" value={otrosPasivosNoCorrientes} onValueChange={setOtrosPasivosNoCorrientes} isEditable />

                <AccountEntry label="Total Pasivo" value={totalPasivo} isTotal />
              </div>
              
              {/* PATRIMONIO */}
               <div className="border rounded-lg p-4 bg-background">
                <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-green-500" />PATRIMONIO</h3>
                
                <SectionTitle icon={BookUser} title="Capital Social" />
                <AccountEntry label="Capital Social" value={capitalSocial} onValueChange={setCapitalSocial} isEditable />
                <AccountEntry label="Reservas" value={reservas} onValueChange={setReservas} isEditable />

                <SectionTitle icon={BarChart} title="Resultados Acumulados" />
                <AccountEntry label="Utilidades Retenidas" value={resultadosAcumulados} onValueChange={setResultadosAcumulados} isEditable />
                <AccountEntry label="Resultado del Ejercicio" value={utilidadNeta} />
                
                <div className='mt-4 pt-4 border-t-2 space-y-2'>
                    <AccountEntry label="Total Patrimonio" value={totalPatrimonio} isTotal/>
                    <AccountEntry label="Total Pasivo y Patrimonio" value={totalPasivoPatrimonio} isTotal/>
                </div>
                 {Math.abs(diferencia) < 0.01 ? (
                    <p className="text-green-600 text-xs mt-2 text-center font-semibold bg-green-100 p-2 rounded-md flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" /> ¡La ecuación contable se cumple!
                    </p>
                ) : (
                    <p className="text-red-500 text-xs mt-2 text-center font-semibold bg-red-100 p-2 rounded-md">
                        La ecuación no cuadra. Diferencia: ${diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="income-statement" className="mt-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6" />
                        <div>
                            <CardTitle className="text-xl">Estado de Resultados</CardTitle>
                            <CardDescription>Periodo: Anual</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={recalculateData}><Calculator className="mr-2"/>Recalcular</Button>
                        <Button><Save className="mr-2"/>Guardar</Button>
                    </div>
                </CardHeader>
                <CardContent className="max-w-3xl mx-auto">
                   <div className="border rounded-lg p-4 bg-background">
                        <SectionTitle icon={TrendingUp} title="Ingresos" />
                        <AccountEntry label="Ventas Netas" value={ingresosVentas} onValueChange={setIngresosVentas} isEditable />

                        <SectionTitle icon={TrendingDown} title="Costo de Ventas" />
                        <AccountEntry label="Costo de la Mercancía Vendida" value={costoVentas} onValueChange={setCostoVentas} isEditable />
                        
                        <AccountEntry label="Utilidad Bruta" value={utilidadBruta} isSubtotal />

                        <SectionTitle icon={Coins} title="Gastos de Operación" />
                        <AccountEntry label="Gastos de Venta y Distribución" value={gastosVenta} onValueChange={setGastosVenta} isEditable />
                        <AccountEntry label="Gastos de Administración" value={gastosAdmin} onValueChange={setGastosAdmin} isEditable />
                        <AccountEntry label="Total Gastos de Operación" value={totalGastosOp} isSubtotal />

                        <AccountEntry label="Utilidad de Operación" value={utilidadOperacion} isSubtotal />
                        
                        <SectionTitle icon={DollarSign} title="Resultado Integral de Financiamiento" />
                        <AccountEntry label="Otros Ingresos" value={otrosIngresos} onValueChange={setOtrosIngresos} isEditable />
                        <AccountEntry label="Gastos Financieros" value={gastosFinancieros} onValueChange={setGastosFinancieros} isEditable />
                        
                        <AccountEntry label="Utilidad antes de Impuestos" value={utilidadAntesImp} isSubtotal />

                        <SectionTitle icon={HandCoins} title="Impuestos y Utilidad Neta" />
                        <AccountEntry label={`Impuestos a la Utilidad (ISR - ${(impuestosPorcentaje * 100)}%)`} value={impuestos} />

                        <AccountEntry label="Utilidad Neta del Ejercicio" value={utilidadNeta} isTotal />
                   </div>
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="cash-flow" className="mt-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Banknote className="h-6 w-6" />
                        <div>
                            <CardTitle className="text-xl">Flujo de Efectivo</CardTitle>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={recalculateData}><Calculator className="mr-2"/>Calcular Flujo</Button>
                        <Button><Save className="mr-2"/>Guardar</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Columna Izquierda */}
                        <div className='border rounded-lg p-4 bg-background'>
                            <SectionTitle icon={Activity} title="Actividades de Operación"/>
                            <AccountEntry label="Utilidad Neta" value={utilidadNeta} />
                            <AccountEntry label="Depreciación y Amortización" value={depreciacion} onValueChange={setDepreciacion} isEditable/>
                            <AccountEntry label="Cuentas por Cobrar (cambio)" value={cambioCuentasPorCobrar} onValueChange={setCambioCuentasPorCobrar} isEditable/>
                            <AccountEntry label="Inventarios (cambio)" value={cambioInventarios} onValueChange={setCambioInventarios} isEditable/>
                            <AccountEntry label="Cuentas por Pagar (cambio)" value={cambioCuentasPorPagar} onValueChange={setCambioCuentasPorPagar} isEditable/>
                            <AccountEntry label="Total Flujo de Operación" value={totalFlujoOperacion} isSubtotal />
                        </div>
                        {/* Columna Derecha */}
                        <div className='border rounded-lg p-4 bg-background'>
                             <SectionTitle icon={Briefcase} title="Actividades de Inversión"/>
                             <AccountEntry label="Compra de Activos Fijos" value={compraActivos} onValueChange={setCompraActivos} isEditable/>
                             <AccountEntry label="Venta de Activos Fijos" value={ventaActivos} onValueChange={setVentaActivos} isEditable/>
                             <AccountEntry label="Total Flujo de Inversión" value={totalFlujoInversion} isSubtotal />

                             <SectionTitle icon={Recycle} title="Actividades de Financiación"/>
                             <AccountEntry label="Emisión de Deuda" value={emisionDeuda} onValueChange={setEmisionDeuda} isEditable/>
                             <AccountEntry label="Pago de Deuda" value={pagoDeuda} onValueChange={setPagoDeuda} isEditable/>
                             <AccountEntry label="Total Flujo de Financiación" value={totalFlujoFinanciacion} isSubtotal />
                        </div>
                    </div>
                    <div className='flex justify-between items-center text-lg font-bold mt-8 pt-4 border-t-2'>
                        <span>CAMBIO NETO DE EFECTIVO</span>
                        <span className={cn(cambioNetoEfectivo >= 0 ? 'text-green-600' : 'text-red-600')}>
                            ${cambioNetoEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="ratios" className="mt-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Percent className="h-6 w-6" />
                        <div>
                            <CardTitle className="text-xl">Análisis de Ratios</CardTitle>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="secondary"><Calculator className="mr-2"/>Calcular Ratios</Button>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Droplets className="text-blue-500 h-5 w-5"/>Liquidez</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <RatioEntry label="Ratio Corriente" value={ratioCorriente} />
                           <RatioEntry label="Ratio Rápido" value={ratioRapido} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Landmark className="text-amber-500 h-5 w-5"/>Solvencia</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <RatioEntry label="Deuda / Patrimonio" value={ratioDeudaPatrimonio} />
                           <RatioEntry label="Apalancamiento" value={apalancamiento} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><LineChart className="text-green-500 h-5 w-5"/>Rentabilidad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <RatioEntry label="Margen Bruto" value={margenBruto} isPercentage/>
                           <RatioEntry label="Margen Neto" value={margenNeto} isPercentage/>
                           <RatioEntry label="ROA" value={roa} isPercentage/>
                           <RatioEntry label="ROE" value={roe} isPercentage/>
                        </CardContent>
                    </Card>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
