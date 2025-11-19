'use server';

/**
 * @fileOverview A financial analysis AI agent.
 *
 * - analyzeFinancials - A function that analyzes financial statements.
 * - AnalyzeFinancialsInput - The input type for the analyzeFinancials function.
 * - AnalyzeFinancialsOutput - The return type for the analyzeFinancials function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IncomeStatementSchema = z.object({
    revenue: z.number().describe('Total revenue or sales.'),
    cogs: z.number().describe('Cost of Goods Sold.'),
    grossProfit: z.number().describe('Gross Profit (Revenue - COGS).'),
    operatingExpenses: z.number().describe('Total operating expenses (e.g., sales, general, admin).'),
    netIncome: z.number().describe('Net Income (Profit after all expenses and taxes).'),
});

const BalanceSheetSchema = z.object({
    totalAssets: z.number().describe('Total assets (current and non-current).'),
    totalLiabilities: z.number().describe('Total liabilities (current and non-current).'),
    totalEquity: z.number().describe('Total equity.'),
});


const AnalyzeFinancialsInputSchema = z.object({
  incomeStatement: IncomeStatementSchema.describe('The company\'s income statement for the period.'),
  balanceSheet: BalanceSheetSchema.describe('The company\'s balance sheet for the period.'),
});
export type AnalyzeFinancialsInput = z.infer<typeof AnalyzeFinancialsInputSchema>;

const AnalyzeFinancialsOutputSchema = z.object({
  summary: z.string().describe('Un resumen ejecutivo de la salud financiera de la empresa.'),
  keyInsights: z.array(z.string()).describe('Una lista de 2-4 ideas clave, tanto positivas como negativas.'),
  recommendations: z.array(z.string()).describe('Una lista de 3 recomendaciones de acción priorizadas.'),
});
export type AnalyzeFinancialsOutput = z.infer<typeof AnalyzeFinancialsOutputSchema>;

export async function analyzeFinancials(
  input: AnalyzeFinancialsInput
): Promise<AnalyzeFinancialsOutput> {
  return analyzeFinancialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFinancialsPrompt',
  input: { schema: AnalyzeFinancialsInputSchema },
  output: { schema: AnalyzeFinancialsOutputSchema },
  prompt: `Eres un experto analista financiero de IA para una empresa agrícola.
Tu tarea es analizar los estados financieros proporcionados (Estado de Resultados y Balance General) y generar un informe conciso y perspicaz para el dueño del negocio. Toda la salida debe estar en español.

Datos Proporcionados:
Estado de Resultados:
- Ingresos: {{{incomeStatement.revenue}}}
- Costo de los Bienes Vendidos (COGS): {{{incomeStatement.cogs}}}
- Utilidad Bruta: {{{incomeStatement.grossProfit}}}
- Gastos Operativos: {{{incomeStatement.operatingExpenses}}}
- Utilidad Neta: {{{incomeStatement.netIncome}}}

Balance General:
- Activos Totales: {{{balanceSheet.totalAssets}}}
- Pasivos Totales: {{{balanceSheet.totalLiabilities}}}
- Patrimonio Total: {{{balanceSheet.totalEquity}}}

Instrucciones:
1.  **Escribe un Resumen Ejecutivo:** Proporciona una visión general breve y de alto nivel sobre la salud financiera de la empresa.
2.  **Identifica Ideas Clave:** Enumera de 2 a 4 puntos destacando los hallazgos más importantes. Incluye tanto aspectos positivos (ej. márgenes sólidos) como áreas de preocupación (ej. alto apalancamiento).
3.  **Proporciona Recomendaciones Accionables:** Basado en tu análisis, sugiere 3 acciones concretas y priorizadas que el dueño del negocio puede tomar para mejorar su posición financiera. Las recomendaciones deben ser prácticas para un negocio agrícola.

Genera la salida en el formato JSON especificado. La respuesta debe estar completamente en español.`,
});

const analyzeFinancialsFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialsFlow',
    inputSchema: AnalyzeFinancialsInputSchema,
    outputSchema: AnalyzeFinancialsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
