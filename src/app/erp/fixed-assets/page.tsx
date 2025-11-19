'use client';
import { useState, useEffect, useRef, memo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarIcon, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, differenceInMonths } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type FixedAsset = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  acquisitionCost: number;
  acquisitionDate: Timestamp;
  usefulLife: number; // in years
  location: string;
  monthlyDepreciation: number;
  currentValue: number;
};

export default function FixedAssetsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const assetsCollection = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return collection(firestore, 'fixed_assets');
  }, [firestore, user]);
  const { data: assets, isLoading: areAssetsLoading } = useCollection<FixedAsset>(assetsCollection);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('activo');
  const [acquisitionCost, setAcquisitionCost] = useState(0);
  const [acquisitionDate, setAcquisitionDate] = useState<Date>();
  const [usefulLife, setUsefulLife] = useState(0);
  const [location, setLocation] = useState('');

  // Calculated State
  const [monthlyDepreciation, setMonthlyDepreciation] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);

  const calculateDepreciation = (cost: number, life: number, date?: Date) => {
    if (!date) {
        setCurrentValue(cost);
        setMonthlyDepreciation(0);
        return;
    }

    const dep = cost > 0 && life > 0 ? cost / (life * 12) : 0;
    setMonthlyDepreciation(dep);

    const monthsElapsed = differenceInMonths(new Date(), date);
    const totalDepreciation = dep * monthsElapsed;
    const value = Math.max(0, cost - totalDepreciation);
    setCurrentValue(value);
  }

  useEffect(() => {
    calculateDepreciation(acquisitionCost, usefulLife, acquisitionDate);
  }, [acquisitionCost, usefulLife, acquisitionDate]);
  
  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setStatus('activo');
    setAcquisitionCost(0);
    setAcquisitionDate(undefined);
    setUsefulLife(0);
    setLocation('');
    setIsEditing(null);
  };
  
  const handleAddAsset = () => {
    if (!firestore) return;
    if (!name || !category || !acquisitionDate || !location || acquisitionCost <= 0 || usefulLife <= 0) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }
    
    const finalMonthlyDepreciation = acquisitionCost / (usefulLife * 12);
    const monthsElapsed = differenceInMonths(new Date(), acquisitionDate);
    const finalCurrentValue = Math.max(0, acquisitionCost - (finalMonthlyDepreciation * monthsElapsed));
    
    const id = isEditing || `ASSET-${Date.now()}`;
    const docRef = doc(firestore, 'fixed_assets', id);

    const newAsset: Omit<FixedAsset, 'id'> = {
        name,
        category,
        description,
        status,
        acquisitionCost,
        acquisitionDate: Timestamp.fromDate(acquisitionDate),
        usefulLife,
        location,
        monthlyDepreciation: finalMonthlyDepreciation,
        currentValue: finalCurrentValue,
    };
    
    setDocumentNonBlocking(docRef, newAsset, { merge: true });
    resetForm();
  };

  const handleEdit = (asset: FixedAsset) => {
    setIsEditing(asset.id);
    setName(asset.name);
    setCategory(asset.category);
    setDescription(asset.description);
    setStatus(asset.status);
    setAcquisitionCost(asset.acquisitionCost);
    setAcquisitionDate(asset.acquisitionDate.toDate());
    setUsefulLife(asset.usefulLife);
    setLocation(asset.location);
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'fixed_assets', id);
    deleteDocumentNonBlocking(docRef);
  };


  return (
    <div className="flex flex-col gap-6" ref={pageTopRef}>
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          {isEditing ? 'Editar Activo Fijo' : 'Registro de Activos Fijos'}
        </h1>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="assetName">Nombre del Activo</label>
              <Input id="assetName" placeholder="Ej: Tractor John Deere" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="category">Categoría</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maquinaria">Maquinaria</SelectItem>
                  <SelectItem value="equipo">Equipo de Oficina</SelectItem>
                  <SelectItem value="vehiculos">Vehículos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description">Descripción</label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el activo..."
              value={description} 
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="status">Estado</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
                  <SelectItem value="baja">De Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <label htmlFor="acquisitionCost">Costo de Adquisición</label>
                <Input id="acquisitionCost" type="number" value={acquisitionCost} onChange={e => setAcquisitionCost(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
                <label htmlFor="acquisitionDate">Fecha de Adquisición</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !acquisitionDate && 'text-muted-foreground'
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {acquisitionDate ? format(acquisitionDate, 'PPP') : <span>dd/mm/aaaa</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={acquisitionDate}
                        onSelect={setAcquisitionDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="usefulLife">Vida Útil (años)</label>
                    <Input id="usefulLife" type="number" value={usefulLife} onChange={e => setUsefulLife(parseInt(e.target.value, 10) || 0)} />
                </div>
                 <div className="space-y-2">
                    <label htmlFor="location">Sucursal de Ubicación</label>
                    <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger id="location">
                        <SelectValue placeholder="Seleccionar sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="matriz">Matriz</SelectItem>
                        <SelectItem value="sucursal-norte">Sucursal Norte</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="monthlyDepreciation">Depreciación Mensual (MXN)</label>
                    <Input id="monthlyDepreciation" value={monthlyDepreciation.toFixed(2)} disabled className="bg-muted/50"/>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="currentValue">Valor Actual Estimado (MXN)</label>
                    <Input id="currentValue" value={currentValue.toFixed(2)} disabled className="bg-muted/50"/>
                </div>
           </div>
          <div className="flex justify-end gap-2">
            {isEditing && <Button variant="outline" onClick={resetForm}>Cancelar Edición</Button>}
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddAsset}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar Activo' : 'Registrar Activo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Listado de Activos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>NOMBRE</TableHead>
                    <TableHead>COSTO</TableHead>
                    <TableHead>VALOR ACTUAL</TableHead>
                    <TableHead>FECHA COMPRA</TableHead>
                    <TableHead>DEPRECIACIÓN/MES</TableHead>
                    <TableHead className="text-right">ACCIONES</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {areAssetsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !assets || assets.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No hay activos registrados aún.
                    </TableCell>
                    </TableRow>
                ) : (
                    assets.map(asset => (
                    <TableRow key={asset.id}>
                        <TableCell className='font-medium'>{asset.name}</TableCell>
                        <TableCell>MXN {asset.acquisitionCost.toFixed(2)}</TableCell>
                        <TableCell>MXN {asset.currentValue.toFixed(2)}</TableCell>
                        <TableCell>{format(asset.acquisitionDate.toDate(), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>MXN {asset.monthlyDepreciation.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(asset)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(asset.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
