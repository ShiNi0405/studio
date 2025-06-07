
// src/ai/flows/suggest-time-slots.ts
// 'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest optimal 1-hour time slots
 *  for a barber appointment, considering the barber's availability, the customer's
 *  preferred time of day, and the selected date.
 *
 * - suggestTimeSlots - The main function that triggers the flow.
 * - SuggestTimeSlotsInput - The input type for the suggestTimeSlots function.
 * - SuggestTimeSlotsOutput - The output type for the suggestTimeSlots function.
 */

/*
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimeSlotsInputSchema = z.object({
  barberAvailability: z
    .string()
    .describe(
      'A JSON string representing the barber weekly availability, e.g., \'{"monday": ["09:00-12:00", "13:00-17:00"], "tuesday": ["09:00-17:00"]}\'. This describes the general working hours for each day of the week.'
    ),
  preferredTimeOfDay: z
    .string()
    .describe(
      'The customer preferred time of day, e.g., Morning, Afternoon, or Evening.'
    ),
  selectedDate: z
    .string()
    .describe(
      'The specific date the customer has selected for the appointment, in YYYY-MM-DD format. This is the target date for the appointment slots.'
    ),
});
export type SuggestTimeSlotsInput = z.infer<typeof SuggestTimeSlotsInputSchema>;

const SuggestTimeSlotsOutputSchema = z.object({
  suggestedTimeSlots: z
    .array(z.string())
    .describe(
      'An array of up to three suggested 1-hour time slots in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss") for the *selectedDate*. Return an empty array if no slots are suitable.'
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
Your task is to suggest up to three distinct 1-hour appointment slots ONLY for the 'selectedDate'.

Inputs you will receive:
- Barber's general weekly availability (JSON string, keys are lowercase day names like "monday", values are arrays of time ranges like "HH:mm-HH:mm"). This is their usual schedule.
- Customer's preferred time of day (e.g., "Morning", "Afternoon", "Evening") for the appointment on the 'selectedDate'.
- The specific 'selectedDate' (YYYY-MM-DD format) the customer wants the appointment on.

Instructions:
1.  Determine the day of the week for the 'selectedDate'.
2.  Using the 'barberAvailability' JSON, find the barber's general working hours for THAT specific day of the week.
3.  Consider the 'preferredTimeOfDay' on the 'selectedDate':
    - Morning: 08:00 to 12:00
    - Afternoon: 12:00 to 17:00
    - Evening: 17:00 to 21:00
4.  Generate up to three 1-hour appointment slots. These slots MUST be:
    a.  On the 'selectedDate'.
    b.  Within the barber's working hours for that day of the week (from 'barberAvailability').
    c.  Within the 'preferredTimeOfDay' range.
    d.  Start on the hour (e.g., 09:00, 10:00, not 09:30).
5.  Format each suggested slot as a full ISO 8601 date-time string (e.g., "YYYY-MM-DDTHH:mm:00"). The date part MUST match the 'selectedDate'.
6.  If no suitable slots are found based on all criteria (barber's availability for the day, preferred time, on the hour), return an empty array for 'suggestedTimeSlots'.
7.  Do not suggest slots outside the barber's stated availability for that day on the 'selectedDate'.

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
    return { suggestedTimeSlots: output?.suggestedTimeSlots || [] };
  }
);

*/

// This flow is currently not used as the booking process has been simplified.
// The customer now selects a date and preferred time of day directly.
// If AI slot suggestions are needed in the future, this can be uncommented and updated.
export {}; // Add an empty export to satisfy TypeScript if the file is otherwise empty
