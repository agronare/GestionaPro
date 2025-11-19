'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { memo } from "react";

type TalentCardProps = {
    title: string;
    description: string;
};

const TalentCard = memo(({ title, description }: TalentCardProps) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50">
        <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-end text-sm text-primary font-semibold">
                <span>Acceder</span>
                <ArrowRight className="h-4 w-4 ml-1" />
            </div>
        </CardContent>
    </Card>
));
TalentCard.displayName = 'TalentCard';

export default function TalentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Gestión de Talento
        </h1>
        <p className="text-muted-foreground">
            Automatice la integración de nuevos empleados, el proceso de salida, la gestión del desempeño y los planes de carrera.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TalentCard 
            title="Onboarding & Offboarding"
            description="Gestione el ciclo de vida del empleado desde el inicio hasta el final."
        />
        <TalentCard 
            title="Gestión de Desempeño"
            description="Realice evaluaciones, establezca objetivos y de seguimiento."
        />
        <TalentCard 
            title="Capacitación y Desarrollo"
            description="Administre programas de formación y certificaciones."
        />
        <TalentCard 
            title="Sucesión y Planes de Carrera"
            description="Identifique talento clave y prepare a los futuros líderes."
        />
      </div>
    </div>
  );
}
