'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BookOpen, Building, HeartPulse, FileText, Users, ArrowRight, ExternalLink } from "lucide-react";

type ComplianceActionProps = {
    icon: React.ElementType;
    text: string;
};

const ComplianceAction = ({ icon: Icon, text }: ComplianceActionProps) => (
    <div className="flex items-center gap-3 rounded-md p-3 hover:bg-muted cursor-pointer transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{text}</span>
    </div>
);

type ComplianceCardProps = {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
    footerText: string;
    iconColor?: string;
};

const ComplianceCard = ({ icon: Icon, title, description, children, footerText, iconColor }: ComplianceCardProps) => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <div className={`p-2 bg-muted rounded-md ${iconColor || 'text-primary'}`}>
                    <Icon className="h-5 w-5"/>
                </div>
                <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-2">
            {children}
        </CardContent>
        <div className="p-6 pt-2">
            <a href="#" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                {footerText} <ArrowRight className="h-4 w-4" />
            </a>
        </div>
    </Card>
);

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Cumplimiento Normativo
        </h1>
        <p className="text-muted-foreground">
          Gestione y asegure el cumplimiento de las regulaciones laborales, fiscales y de seguridad social.
        </p>
      </div>

       <Card className="bg-muted/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary"/>
                    <CardTitle className="text-lg">Estado General del Cumplimiento</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Puntaje de Cumplimiento</p>
                    <p className="text-4xl font-bold text-primary">0%</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Alertas y Tareas Pendientes</p>
                    <p className="font-semibold">No hay alertas pendientes.</p>
                </div>
            </CardContent>
            <div className="px-6 pb-4">
                 <p className="text-xs text-muted-foreground">
                    El puntaje se basa en la documentación completa, contratos vigentes y encuestas NOM-035 realizadas.
                </p>
            </div>
       </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ComplianceCard
            icon={BookOpen}
            title="LFT"
            description="Gestión de contratos, jornada laboral y vacaciones."
            footerText="Ver más detalles"
            iconColor="text-green-600"
        >
            <ComplianceAction icon={FileText} text="Administrar Contratos" />
            <ComplianceAction icon={Users} text="Gestionar Documentos de Empleados" />
        </ComplianceCard>
        <ComplianceCard
            icon={Building}
            title="IMSS e INFONAVIT"
            description="Altas, bajas, modificaciones y cálculo de cuotas."
            footerText="Ir al portal de INFONAVIT"
            iconColor="text-blue-600"
        >
            <ComplianceAction icon={ExternalLink} text="Conexión IDSE" />
            <ComplianceAction icon={FileText} text="Generar Archivos SUA" />
        </ComplianceCard>
        <ComplianceCard
            icon={HeartPulse}
            title="NOM-035 y NOM-037"
            description="Riesgos psicosociales y teletrabajo."
            footerText="Ver planes de acción"
            iconColor="text-purple-600"
        >
            <ComplianceAction icon={FileText} text="Administrar Encuestas NOM-035" />
            <ComplianceAction icon={FileText} text="Política de Teletrabajo" />
        </ComplianceCard>
      </div>
    </div>
  );
}
