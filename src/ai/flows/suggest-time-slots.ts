// src/ai/flows/suggest-time-slots.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest optimal 1-hour time slots
 *  for a barber appointment, considering the barber's availability and the customer's
 *  preferred time of day.
 *
 * - suggestTimeSlots - The main function that triggers the flow.
 * - SuggestTimeSlotsInput - The input type for the suggestTimeSlots function.
 * - SuggestTimeSlotsOutput - The output type for the suggestTimeSlots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimeSlotsInputSchema = z.object({
  barberAvailability: z
    .string()
    .describe(
      'A string representing the barber availability, e.g., a JSON stringified array of time ranges.'
    ),
  preferredTimeOfDay: z
    .string()
    .describe(
      'The customer preferred time of day, e.g., Morning, Afternoon, or Evening.'
    ),
});
export type SuggestTimeSlotsInput = z.infer<typeof SuggestTimeSlotsInputSchema>;

const SuggestTimeSlotsOutputSchema = z.object({
  suggestedTimeSlots: z
    .array(z.string())
    .describe(
      'An array of three suggested 1-hour time slots in ISO 8601 format.'
    ),
});
export type SuggestTimeSlotsOutput = z.infer<typeof SuggestTimeSlotsOutputSchema>;

export async function suggestTimeSlots(
  input: SuggestTimeSlotsInput
): Promise<SuggestTimeSlotsOutput> {
  return suggestTimeSlotsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimeSlotsPrompt',
  input: {schema: SuggestTimeSlotsInputSchema},
  output: {schema: SuggestTimeSlotsOutputSchema},
  prompt: `You are an AI assistant helping to schedule barber appointments.

You will receive the barber's availability and the customer's preferred time of day.  You must respond with 3 distinct 1-hour time slots that are within the barbers availability, formatted in ISO 8601 format.  Do not include any time slots outside of the barber's availability.

Barber Availability: {{{barberAvailability}}}
Customer Preferred Time of Day: {{{preferredTimeOfDay}}}`,
});

const suggestTimeSlotsFlow = ai.defineFlow(
  {
    name: 'suggestTimeSlotsFlow',
    inputSchema: SuggestTimeSlotsInputSchema,
    outputSchema: SuggestTimeSlotsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
