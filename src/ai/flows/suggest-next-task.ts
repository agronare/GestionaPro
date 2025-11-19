'use server';

/**
 * @fileOverview AI-powered task suggestion flow.
 *
 * - suggestNextTask - A function that suggests the next relevant business task.
 * - SuggestNextTaskInput - The input type for the suggestNextTask function.
 * - SuggestNextTaskOutput - The return type for the suggestNextTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextTaskInputSchema = z.object({
  currentWorkflow: z
    .string()
    .describe('The current business workflow description.'),
  businessData: z
    .string()
    .describe(
      'The current business data, including financial data, employee information, and any relevant documents.'
    ),
});
export type SuggestNextTaskInput = z.infer<typeof SuggestNextTaskInputSchema>;

const SuggestNextTaskOutputSchema = z.object({
  suggestedTask: z.string().describe('The next suggested task to perform.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested task.'),
});
export type SuggestNextTaskOutput = z.infer<typeof SuggestNextTaskOutputSchema>;

export async function suggestNextTask(
  input: SuggestNextTaskInput
): Promise<SuggestNextTaskOutput> {
  return suggestNextTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextTaskPrompt',
  input: {schema: SuggestNextTaskInputSchema},
  output: {schema: SuggestNextTaskOutputSchema},
  prompt: `You are an AI assistant that helps business users determine the next most relevant task to perform in their business.

Given the current business workflow and data, suggest the next task to perform and the reasoning behind it.

Current Workflow: {{{currentWorkflow}}}
Business Data: {{{businessData}}}

Output the next suggested task and the reasoning behind it.

Task: {{suggestedTask}}
Reasoning: {{reasoning}}`,
});

const suggestNextTaskFlow = ai.defineFlow(
  {
    name: 'suggestNextTaskFlow',
    inputSchema: SuggestNextTaskInputSchema,
    outputSchema: SuggestNextTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
