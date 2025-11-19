
'use client'
import { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Truck,
  MapPin,
  FileText,
  X,
  Plus,
  Loader2,
  Wand2,
  FileDown,
  DollarSign,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogistics, type Vehicle } from '../context';
import { Skeleton } from '@/components/ui/skeleton';
import { generateItinerary, type ItineraryOutput } from '@/ai/flows/generate-itinerary';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';
import { useJsApiLoader } from '@react-google-maps/api';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

type ItineraryResult = {
    optimizedStops: ItineraryOutput['optimizedStops'];
    totalDistance: number;
    totalTime: string;
};

type ExpenseItem = {
    id: number;
    concept: string;
    amount: number;
};

const PlannerSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className='space-y-2'>
                <Skeleton className="h-6 w-72" />
                <Skeleton className="h-4 w-96" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className='lg:col-span-1 space-y-6'>
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            </div>
            <div className='lg:col-span-1 space-y-6'>
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            </div>
            <div className='lg:col-span-1'>
                 <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);

function PlannerContent() {
  const { vehicles, isLoading } = useLogistics();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [startPoint, setStartPoint] = useState('Oficina Principal');
  const [stops, setStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryResult | null>(null);
  const { toast } = useToast();
  const [mapUrl, setMapUrl] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '' });
  const firestore = useFirestore();
  const { user } = useUser();
  const [fuelPrices, setFuelPrices] = useState({ Diesel: 24.50, Gasolina: 22.80 });

  const libraries: ("places" | "directions")[] = useMemo(() => ["places", "directions"], []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [expenses]);
  
  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (newExpense.concept && !isNaN(amount) && amount > 0) {
      setExpenses([...expenses, { ...newExpense, amount, id: Date.now() }]);
      setNewExpense({ concept: '', amount: '' });
    }
  };
  
  const handleRemoveExpense = (id: number) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };


  useEffect(() => {
    if (itinerary) {
      const origin = encodeURIComponent(startPoint);
      const destination = encodeURIComponent(itinerary.optimizedStops[itinerary.optimizedStops.length - 1].location);
      const waypoints = itinerary.optimizedStops.slice(0, -1).map(stop => encodeURIComponent(stop.location)).join('|');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error("Google Maps API key is missing.");
        toast({
          variant: "destructive",
          title: "Error de configuración",
          description: "La clave de API de Google Maps no está configurada.",
        });
        return;
      }

      setMapUrl(`https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`);
      
      const vehicle = vehicles?.find(v => v.id === selectedVehicleId);
      if (vehicle?.fuelEfficiency && vehicle?.fuelType && itinerary.totalDistance > 0) {
          const fuelNeeded = itinerary.totalDistance / vehicle.fuelEfficiency;
          const fuelPrice = fuelPrices[vehicle.fuelType] || 0;
          const fuelCost = fuelNeeded * fuelPrice;
          
          setExpenses(prev => [
              ...prev.filter(e => e.concept !== 'Combustible (Calculado)'),
              { id: Date.now(), concept: 'Combustible (Calculado)', amount: fuelCost }
          ]);
      }
    }
  }, [itinerary, startPoint, toast, vehicles, selectedVehicleId, fuelPrices]);

  const handleAddStop = () => {
    if (newStop.trim()) {
      setStops([...stops, newStop.trim()]);
      setNewStop('');
    }
  };

  const handleRemoveStop = (indexToRemove: number) => {
    setStops(stops.filter((_, index) => index !== indexToRemove));
  };
  
  const handleGenerateDraft = async () => {
    if (!canGenerate || !isLoaded) {
        toast({ title: "Error", description: "Selecciona un vehículo y añade paradas.", variant: "destructive" });
        return;
    }
    
    setIsGenerating(true);
    setItinerary(null);

    try {
        const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);
        if (!selectedVehicle) {
            throw new Error("Vehículo no encontrado.");
        }

        const aiResponse = await generateItinerary({
            vehicle: `${selectedVehicle.name} (${selectedVehicle.plate})`,
            startPoint: startPoint,
            stops: stops
        });
        
        const directionsService = new google.maps.DirectionsService();
        const waypoints = aiResponse.optimizedStops
            .slice(0, -1)
            .map(stop => ({ location: stop.location, stopover: true }));
        
        const request: google.maps.DirectionsRequest = {
            origin: startPoint,
            destination: aiResponse.optimizedStops[aiResponse.optimizedStops.length - 1].location,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result, status) => {
            if (status === 'OK' && result) {
                const route = result.routes[0];
                let totalDistanceMeters = 0;
                let totalDurationSeconds = 0;

                route.legs.forEach(leg => {
                    totalDistanceMeters += leg.distance?.value || 0;
                    totalDurationSeconds += leg.duration?.value || 0;
                });
                
                const totalDistanceKm = totalDistanceMeters / 1000;
                const hours = Math.floor(totalDurationSeconds / 3600);
                const minutes = Math.round((totalDurationSeconds % 3600) / 60);
                const totalTimeString = `${hours > 0 ? `${hours} hora(s) y ` : ''}${minutes} minutos`;

                setItinerary({
                    optimizedStops: aiResponse.optimizedStops,
                    totalDistance: totalDistanceKm,
                    totalTime: totalTimeString,
                });
                
                toast({ title: "Borrador generado", description: "Se calculó la ruta y distancia con Google Maps." });
            } else {
                throw new Error(`Error de Google Maps: ${status}`);
            }
        });

    } catch (error: any) {
        console.error("Error generating itinerary: ", error);
        toast({ title: "Error", description: error.message || "No se pudo generar el itinerario.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleSaveItinerary = async () => {
    if (!itinerary || !user) return;
    
    const newDeliveryRef = doc(collection(firestore, 'deliveries'));
    const deliveryData = {
        id: newDeliveryRef.id,
        folio: `ENT-${newDeliveryRef.id.substring(0,6)}`,
        client: itinerary.optimizedStops.map(s => s.location).join(', '),
        destination: "Ruta Planificada",
        deliveryDate: format(new Date(), 'dd/MM/yyyy'),
        status: 'En Preparación' as const,
        vehicleId: selectedVehicleId,
    };
    addDocumentNonBlocking(newDeliveryRef, deliveryData);

    const expensesCollection = collection(firestore, 'logistics_expenses');
    for (const expense of expenses) {
        const newExpenseRef = doc(expensesCollection);
        const expenseData = {
            id: newExpenseRef.id,
            date: format(new Date(), 'dd/MM/yyyy'),
            concept: expense.concept,
            amount: expense.amount,
            vehicleId: selectedVehicleId,
            tripId: newDeliveryRef.id,
            tripType: 'delivery',
            notes: `Gasto de ruta planificada`
        };
        addDocumentNonBlocking(newExpenseRef, expenseData);
    }
    
    toast({
        title: "Itinerario Guardado",
        description: "La ruta y sus gastos han sido registrados exitosamente."
    });

    setItinerary(null);
    setExpenses([]);
    setStops([]);
    setSelectedVehicleId(undefined);
  }
  
  const canGenerate = selectedVehicleId && stops.length > 0 && startPoint;

  if (loadError) {
      return (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al cargar Google Maps</AlertTitle>
              <AlertDescription>
                  No se pudo cargar el script de Google Maps. Esto puede deberse a varias razones:
                  <ul className="list-disc pl-5 mt-2">
                      <li>La facturación no está habilitada para tu proyecto de Google Cloud.</li>
                      <li>Las APIs necesarias (Maps JavaScript, Directions, Places) no están activadas.</li>
                      <li>La clave de API tiene restricciones que impiden su uso en este dominio.</li>
                  </ul>
                  <Button variant="link" asChild className="p-0 h-auto mt-2">
                      <Link href="https://console.cloud.google.com" target="_blank">
                          Ir a la consola de Google Cloud para verificar
                      </Link>
                  </Button>
              </AlertDescription>
          </Alert>
      )
  }

  if (!isLoaded) {
      return <PlannerSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
          <MapPin className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
            Planificador de Rutas Inteligente
          </h1>
          <p className="text-muted-foreground">
            Organiza itinerarios, calcula distancias y gestiona los gastos de cada viaje.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Columna 1: Configuración */}
          <div className='flex flex-col gap-6 lg:col-span-1'>
              <Card>
                  <CardHeader>
                      <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">1. Configurar la ruta</CardTitle>
                      </div>
                  </CardHeader>
                  <CardContent className='grid grid-cols-1 gap-6'>
                      <div>
                          <label className="text-sm font-medium">Vehículo</label>
                          {isLoading ? (
                          <Skeleton className="h-10 w-full mt-2" />
                          ) : (
                          <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                              <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Elige un vehículo de tu flota..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {vehicles?.map(vehicle => (
                                      <SelectItem key={vehicle.id} value={vehicle.id}>
                                          {vehicle.name} ({vehicle.plate})
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          )}
                      </div>
                      <div>
                          <label className="text-sm font-medium">Punto de Partida</label>
                          <Input 
                          value={startPoint} 
                          onChange={(e) => setStartPoint(e.target.value)} 
                          className="mt-2"
                          />
                      </div>
                      <div>
                          <label className="text-sm font-medium">Precios de Combustible (MXN/L)</label>
                          <div className='grid grid-cols-2 gap-2 mt-2'>
                              <div className="relative">
                                  <label htmlFor="diesel-price" className="absolute -top-2 left-2 text-xs bg-card px-1 text-muted-foreground">Diesel</label>
                                  <Input 
                                      id="diesel-price"
                                      type="number"
                                      value={fuelPrices.Diesel}
                                      onChange={(e) => setFuelPrices(prev => ({ ...prev, Diesel: parseFloat(e.target.value) || 0 }))}
                                  />
                              </div>
                              <div className="relative">
                                  <label htmlFor="gasolina-price" className="absolute -top-2 left-2 text-xs bg-card px-1 text-muted-foreground">Gasolina</label>
                                  <Input 
                                      id="gasolina-price"
                                      type="number"
                                      value={fuelPrices.Gasolina}
                                      onChange={(e) => setFuelPrices(prev => ({ ...prev, Gasolina: parseFloat(e.target.value) || 0 }))}
                                  />
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
          
          {/* Columna 2: Itinerario y Gastos */}
          <div className='flex flex-col gap-6 lg:col-span-1'>
              <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">2. Itinerario y Gastos</CardTitle>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <label className="text-sm font-medium">Definir paradas del itinerario</label>
                  <div className="flex items-center gap-2">
                      <Input 
                          placeholder="Ej: Rancho El Sol, Km 12" 
                          value={newStop}
                          onChange={(e) => setNewStop(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddStop()}
                      />
                      <Button onClick={handleAddStop}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                      </Button>
                  </div>
                  {stops.length > 0 && (
                      <div className='space-y-2 rounded-md border p-2'>
                          {stops.map((stop, index) => (
                              <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted">
                                  <div className='flex items-center gap-3'>
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{index + 1}</span>
                                      <p className='text-sm'>{stop}</p>
                                  </div>
                                  <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleRemoveStop(index)}>
                                      <X className="h-4 w-4 text-destructive" />
                                  </Button>
                              </div>
                          ))}
                      </div>
                  )}
                  <div className="pt-4 border-t">
                      <Button onClick={handleGenerateDraft} variant="secondary" disabled={!canGenerate || isGenerating}>
                          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                          {isGenerating ? 'Generando...' : 'Generar Borrador con IA'}
                      </Button>
                  </div>
              </CardContent>
              </Card>
              
               <Card>
                  <CardHeader>
                      <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Registrar Gastos</CardTitle>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                           <Select onValueChange={(value) => setNewExpense({ ...newExpense, concept: value })}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Concepto" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Combustible">Combustible</SelectItem>
                                  <SelectItem value="Casetas">Casetas</SelectItem>
                                  <SelectItem value="Viáticos">Viáticos</SelectItem>
                                  <SelectItem value="Otro">Otro</SelectItem>
                              </SelectContent>
                          </Select>
                          <Input
                              type="number"
                              placeholder="Monto"
                              value={newExpense.amount}
                              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          />
                          <Button onClick={handleAddExpense}>
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar
                          </Button>
                      </div>
                      {expenses.length > 0 && (
                           <div className='space-y-2 rounded-md border p-2'>
                              {expenses.map(expense => (
                                  <div key={expense.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                      <p>{expense.concept}</p>
                                      <div className='flex items-center gap-2'>
                                          <p className='font-semibold'>{formatCurrency(expense.amount)}</p>
                                          <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleRemoveExpense(expense.id)}>
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                      </div>
                                  </div>
                              ))}
                               <div className="flex items-center justify-between p-2 font-bold border-t mt-2">
                                  <p>Total Gastos:</p>
                                  <p>{formatCurrency(totalExpenses)}</p>
                              </div>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>

          {/* Columna 3: Itinerario */}
          <div className='sticky top-24 lg:col-span-1'>
              <Card>
                  <CardHeader>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">3. Resumen y Mapa</CardTitle>
                          </div>
                          <Button variant="outline" size="sm" disabled={!itinerary}>
                              <FileDown className='mr-2 h-4 w-4'/>
                              Exportar PDF
                          </Button>
                      </div>
                      <CardDescription>Ruta optimizada y gastos del viaje.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {isGenerating && (
                          <div className="space-y-4">
                              <Skeleton className="h-8 w-3/4" />
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-40 w-full" />
                          </div>
                      )}
                      {!itinerary && !isGenerating && (
                          <div className="text-center py-16 text-muted-foreground">
                              <p>El itinerario y el mapa aparecerán aquí.</p>
                          </div>
                      )}
                      {itinerary && (
                          <div className='space-y-4'>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                      <p className='font-bold'>Distancia Total:</p>
                                      <p>{itinerary.totalDistance.toFixed(1)} km</p>
                                  </div>
                                  <div>
                                      <p className='font-bold'>Tiempo Estimado:</p>
                                      <p>{itinerary.totalTime}</p>
                                  </div>
                              </div>
                              <div className="space-y-3">
                              {itinerary.optimizedStops.map((stop, index) => (
                                  <div key={index} className="flex gap-4 items-start">
                                  <div className="flex flex-col items-center">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{index + 1}</div>
                                      {index < itinerary.optimizedStops.length - 1 && <div className="w-px h-8 bg-border" />}
                                  </div>
                                  <div className='pt-1'>
                                      <p className="font-semibold">{stop.location}</p>
                                      <p className="text-xs text-muted-foreground">{stop.note}</p>
                                  </div>
                                  </div>
                              ))}
                              </div>
                              {mapUrl && (
                                  <div className='mt-4 aspect-video w-full'>
                                      <iframe
                                          width="100%"
                                          height="100%"
                                          style={{ border: 0, borderRadius: '0.5rem' }}
                                          loading="lazy"
                                          allowFullScreen
                                          src={mapUrl}>
                                      </iframe>
                                  </div>
                              )}
                               <div className="pt-4 border-t">
                                  <Button onClick={handleSaveItinerary} className="w-full" disabled={!itinerary}>
                                    Guardar Itinerario y Gastos
                                  </Button>
                              </div>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  )
}

export default function PlannerPage() {
    return (
        <Suspense fallback={<PlannerSkeleton />}>
            <PlannerContent />
        </Suspense>
    )
}

    