'use client';
import React, { useState, useTransition } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  suggestNextTask,
  type SuggestNextTaskOutput,
} from '@/ai/flows/suggest-next-task';
import { Wand2, Loader2, Lightbulb } from 'lucide-react';
import { employees, income, expenses, recentActivity } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

async function getSuggestionAction(): Promise<SuggestNextTaskOutput> {
  const businessDataSummary = `
    Total Employees: ${employees.length}
    Total Income last 30 days: $${income.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
    Total Expenses last 30 days: $${expenses.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
  `;

  const workflowSummary = `
    Recent Activities:
    ${recentActivity
      .slice(0, 3)
      .map(a => `- ${a.user} ${a.action}`)
      .join('\n')}
  `;

  return await suggestNextTask({
    currentWorkflow: workflowSummary,
    businessData: businessDataSummary,
  });
}

export function TaskSuggester() {
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<SuggestNextTaskOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSuggestTask = () => {
    startTransition(async () => {
      setError(null);
      setSuggestion(null);
      try {
        const result = await getSuggestionAction();
        setSuggestion(result);
      } catch (e) {
        setError('No se pudo obtener la sugerencia. Inténtalo de nuevo.');
        console.error(e);
      }
    });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Asistente IA</CardTitle>
          <CardDescription>
            Obtén sugerencias inteligentes para tu próximo paso.
          </CardDescription>
        </div>
        <Button size="icon" variant="ghost" onClick={handleSuggestTask} disabled={isPending}>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        {suggestion && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{suggestion.suggestedTask}</p>
                <p className="text-sm text-muted-foreground">
                  {suggestion.reasoning}
                </p>
              </div>
            </div>
          </div>
        )}
        {!isPending && !suggestion && !error && (
            <div className="text-sm text-muted-foreground text-center py-8">
                Haz clic en la varita mágica para obtener una sugerencia.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
