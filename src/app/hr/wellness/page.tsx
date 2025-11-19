'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse } from "lucide-react";

export default function WellnessPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/9
">
          Salud y Bienestar
        </h1>
        <p className="text-muted-foreground">
          Iniciativas y seguimiento del bienestar del equipo.
        </p>
      </div>
       <Card className="flex flex-1 items-center justify-center rounded-lg border-dashed shadow-sm bg-background/50">
        <CardHeader className="text-center">
            <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <HeartPulse className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Próximamente</CardTitle>
            <CardDescription>El módulo de salud y bienestar estará disponible pronto.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
