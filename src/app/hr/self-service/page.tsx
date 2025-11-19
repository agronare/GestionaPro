'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake } from "lucide-react";

export default function SelfServicePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Autoservicio del Empleado
        </h1>
        <p className="text-muted-foreground">
          Portal para que los empleados gestionen su información y solicitudes.
        </p>
      </div>
       <Card className="flex flex-1 items-center justify-center rounded-lg border-dashed shadow-sm bg-background/50">
        <CardHeader className="text-center">
            <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <HeartHandshake className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">Próximamente</CardTitle>
            <CardDescription>El portal de autoservicio para empleados estará disponible pronto.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
