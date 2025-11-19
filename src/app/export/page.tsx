'use client';
import { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
    LayoutDashboard, 
    Scale, 
    FileText, 
    AreaChart, 
    Percent, 
    GitCompareArrows, 
    Wallet, 
    BrainCircuit, 
    AlertTriangle, 
    Upload,
    File,
    Trash2
} from "lucide-react";
import { cn } from '@/lib/utils';

type Section = {
    key: string;
    title: string;
    icon: React.ElementType;
};

const sections: Section[] = [
    { key: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
    { key: 'balance', title: 'Balance General', icon: Scale },
    { key: 'results', title: 'Estado de Resultados', icon: FileText },
    { key: 'cashflow', title: 'Flujo de Efectivo', icon: AreaChart },
    { key: 'ratios', title: 'Ratios Financieros', icon: Percent },
    { key: 'comparative', title: 'Comparativo', icon: GitCompareArrows },
    { key: 'budget', title: 'Presupuesto', icon: Wallet },
    { key: 'analytics', title: 'Analytics Avanzado', icon: BrainCircuit },
];

type SectionCardProps = {
    section: Section;
    isSelected: boolean;
    onSelect: (key: string) => void;
};

const SectionCard = memo(({ section, isSelected, onSelect }: SectionCardProps) => {
    const Icon = section.icon;
    return (
        <div 
            onClick={() => onSelect(section.key)}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                isSelected ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-muted"
            )}
        >
            <Icon className="h-6 w-6" />
            <p className="text-sm font-medium">{section.title}</p>
        </div>
    );
});
SectionCard.displayName = 'SectionCard';


const FileUploadCard = memo(({ title, onUpload }: { title: string, onUpload: () => void }) => (
    <div 
        onClick={onUpload} 
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
    >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{title}</p>
    </div>
));
FileUploadCard.displayName = 'FileUploadCard';


export default function ExportPage() {
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [isError, setIsError] = useState(false);

    const handleSelectSection = (key: string) => {
        setSelectedSections(prev => 
            prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
        );
    };

    const handleGenerate = () => {
        if (selectedSections.length === 0) {
            setIsError(true);
        } else {
            setIsError(false);
            // Lógica para generar el reporte
            console.log('Generando reporte con secciones:', selectedSections);
        }
    };

    const handleClear = () => {
        setSelectedSections([]);
        setIsError(false);
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
                Personaliza y exporta tus reportes financieros en múltiples formatos.
                </h1>
            </div>

            <Card className="p-6">
                <div className="space-y-8">
                    {/* Configuración de Exportación */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Configuración de Exportación</h2>
                        <h3 className="text-sm text-muted-foreground">Seleccionar Secciones para Exportar</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {sections.map(section => (
                                <SectionCard 
                                    key={section.key}
                                    section={section}
                                    isSelected={selectedSections.includes(section.key)}
                                    onSelect={handleSelectSection}
                                />
                            ))}
                        </div>
                        {isError && (
                            <Alert variant="destructive" className="max-w-md">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>Debes seleccionar al menos una sección.</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    
                    {/* Configuración de Calidad y Personalización */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Configuración de Calidad</h2>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Calidad</label>
                                <Select defaultValue="medium">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Baja</SelectItem>
                                        <SelectItem value="medium">Media (Equilibrada)</SelectItem>
                                        <SelectItem value="high">Alta (Mejor resolución)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="compress-images" defaultChecked />
                                <label htmlFor="compress-images" className="text-sm font-medium">Comprimir imágenes</label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Personalización</h2>
                            <div className="space-y-2">
                                <label htmlFor="report-title" className="text-sm font-medium">Título del Reporte</label>
                                <Input id="report-title" defaultValue="Informe Financiero Mensual" />
                            </div>
                             <div className="space-y-2">
                                <label htmlFor="report-subtitle" className="text-sm font-medium">Subtítulo</label>
                                <Input id="report-subtitle" defaultValue="Período Abril 2025" />
                            </div>
                        </div>
                    </div>

                    {/* Logo y Membrete */}
                    <div className="space-y-4">
                         <h2 className="text-lg font-semibold">Logo y Membrete</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <p className="text-sm font-medium">Logo de la Empresa</p>
                                <FileUploadCard title="Clic para subir logo" onUpload={() => alert('Función no implementada')} />
                             </div>
                             <div className="space-y-2">
                                <p className="text-sm font-medium">Fondo de Membrete</p>
                                <FileUploadCard title="Clic para subir fondo" onUpload={() => alert('Función no implementada')} />
                             </div>
                         </div>
                    </div>

                </div>
            </Card>

            <div className="flex items-center justify-between mt-4">
                <Button variant="destructive" onClick={handleClear}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Todos los Datos
                </Button>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={handleGenerate}>
                        Previsualizar PDF
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={handleGenerate}>
                        <FileText className="mr-2 h-4 w-4" />
                        Descargar PDF
                    </Button>
                    <Button className="bg-green-700 hover:bg-green-800" onClick={handleGenerate}>
                        <File className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                </div>
            </div>
        </div>
    );
}
