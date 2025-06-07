// src/ai/flows/suggest-time-slots.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest optimal 1-hour time slots
 *  for a barber appointment, considering the barber's availability, the customer's
 *  preferred time of day, and the selected date.
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
      'A JSON string representing the barber weekly availability, e.g., \'{"monday": ["09:00-12:00", "13:00-17:00"], "tuesday": ["09:00-17:00"]}\'.'
    ),
  preferredTimeOfDay: z
    .string()
    .describe(
      'The customer preferred time of day, e.g., Morning, Afternoon, or Evening.'
    ),
  selectedDate: z
    .string()
    .describe(
      'The specific date the customer has selected for the appointment, in YYYY-MM-DD format.'
    ),
});
export type SuggestTimeSlotsInput = z.infer<typeof SuggestTimeSlotsInputSchema>;

const SuggestTimeSlotsOutputSchema = z.object({
  suggestedTimeSlots: z
    .array(z.string())
    .describe(
      'An array of up to three suggested 1-hour time slots in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss"). Return an empty array if no slots are suitable.'
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
Your task is to suggest up to three distinct 1-hour appointment slots.

Inputs you will receive:
- Barber's general weekly availability (JSON string, keys are lowercase day names like "monday", values are arrays of time ranges like "HH:mm-HH:mm").
- Customer's preferred time of day (e.g., "Morning", "Afternoon", "Evening").
- The specific date the customer is interested in (YYYY-MM-DD format).

Instructions:
1.  Determine the day of the week for the 'selectedDate'.
2.  Check the barber's general weekly availability for that day of the week. If no specific availability is listed for that day, or if 'barberAvailability' is empty or "{}", assume the barber is unavailable or use standard business hours like 9 AM to 5 PM if that's a general policy (for now, if not specified, assume unavailable for days not listed).
3.  Focus on the 'preferredTimeOfDay' for the 'selectedDate'. "Morning" is roughly 8 AM - 12 PM, "Afternoon" is 12 PM - 5 PM, "Evening" is 5 PM - 9 PM.
4.  Provide up to three 1-hour time slots. The slots MUST be on the 'selectedDate'.
5.  Format each slot as a full ISO 8601 date-time string (e.g., "YYYY-MM-DDTHH:mm:00"). Ensure the time is in the barber's local timezone. (Assume times are for the local timezone of the barber).
6.  Do not suggest slots outside the barber's stated availability for that day. Ensure slots are for whole hours (e.g., 09:00, 10:00, not 09:30).
7.  If no suitable slots are found based on the criteria, return an empty array for suggestedTimeSlots.

Barber Availability (Weekly JSON): {{{barberAvailability}}}
Customer Preferred Time of Day: {{{preferredTimeOfDay}}}
Selected Date for Appointment (YYYY-MM-DD): {{{selectedDate}}}
`,
});

const suggestTimeSlotsFlow = ai.defineFlow(
  {
    name: 'suggestTimeSlotsFlow',
    inputSchema: SuggestTimeSlotsInputSchema,
    outputSchema: SuggestTimeSlotsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure output is not null, and if suggestedTimeSlots is null/undefined, return an empty array.
    return { suggestedTimeSlots: output?.suggestedTimeSlots || [] };
  }
);
