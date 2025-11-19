'use server';

/**
 * @fileOverview An AI flow to generate a travel itinerary.
 *
 * - generateItinerary - A function that creates an optimized route from a list of stops.
 * - ItineraryInput - The input type for the generateItinerary function.
 * - ItineraryOutput - The return type for the generateItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ItineraryInputSchema = z.object({
  vehicle: z.string().describe('The vehicle assigned for the route.'),
  startPoint: z.string().describe('The starting location for the trip.'),
  stops: z.array(z.string()).describe('An unordered list of locations to visit.'),
});
export type ItineraryInput = z.infer<typeof ItineraryInputSchema>;

const ItineraryOutputSchema = z.object({
  optimizedStops: z.array(
    z.object({
      location: z.string().describe('The name of the stop.'),
      note: z.string().describe('A brief, useful note for the driver about this stop (e.g., "pick up documents", "deliver fertilizer").'),
    })
  ).describe('The list of stops in an optimized order.'),
});
export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;

export async function generateItinerary(input: ItineraryInput): Promise<ItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: { schema: ItineraryInputSchema },
  output: { schema: ItineraryOutputSchema },
  prompt: `Eres un experto planificador de logística y jefe de tráfico para una empresa agrícola. Tu misión es crear un itinerario de ruta que sea eficiente y estratégico.

Datos del Viaje:
- Vehículo Asignado: {{{vehicle}}}
- Punto de Partida: {{{startPoint}}}
- Paradas a Visitar (en desorden):
{{#each stops}}
- {{{this}}}
{{/each}}

Instrucciones Detalladas:
1.  **Optimización Estratégica de la Ruta:**
    -   Determina el orden más lógico y eficiente para las paradas, comenzando desde el punto de partida.
    -   El objetivo principal es minimizar la distancia total y el tiempo de viaje.
    -   Si es posible, crea una ruta circular que termine cerca del punto de partida para ahorrar combustible y tiempo al operador.

2.  **Generación de Notas Inteligentes y Accionables para el Conductor:**
    -   Para cada parada, crea una nota útil y concisa.
    -   Infiere el propósito más probable de cada visita basándote en el nombre del lugar. Por ejemplo:
        -   Si el nombre incluye "Bodega", "Cliente", o un nombre de empresa, la nota debe ser "Realizar entrega de producto".
        -   Si el nombre suena a un rancho o parcela (ej. "Rancho El Girasol"), la nota podría ser "Visita técnica de asesoría" o "Recolectar muestra de suelo".
        -   Si es un proveedor conocido (ej. "Refaccionaria del Centro"), la nota debe ser "Recoger insumos/refacciones".
        -   Si el destino es ambiguo, usa una nota genérica como "Seguir indicaciones del cliente".
    -   Las notas deben ser claras y directas para el operador del vehículo.

3.  **Formato de Salida:**
    -   Genera la respuesta estrictamente en el formato JSON especificado.
    -   NO incluyas campos de distancia ni tiempo. Tu única tarea es ordenar las paradas y generar las notas.
    -   Toda la salida, incluyendo notas y descripciones, debe estar completamente en español.`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: ItineraryInputSchema,
    outputSchema: ItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
