
'use server';
/**
 * @fileOverview A Genkit flow to suggest a hairstyle based on face shape and preferred style.
 *
 * - suggestHairstyle - A function that handles the hairstyle suggestion process.
 * - SuggestHairstyleInput - The input type for the suggestHairstyle function.
 * - SuggestHairstyleOutput - The return type for the suggestHairstyle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHairstyleInputSchema = z.object({
  faceShape: z.string().describe('The user face shape (e.g., Round, Oval, Square).'),
  preferredStyleType: z.string().describe('The user preferred style type (e.g., Casual, Trendy, Professional).'),
});
export type SuggestHairstyleInput = z.infer<typeof SuggestHairstyleInputSchema>;

const SuggestHairstyleOutputSchema = z.object({
  suggestedHairstyleName: z.string().describe('The name of the suggested hairstyle. Be specific and creative, e.g., "Voluminous Textured Quiff", "Modern Slick Back".'),
  suggestedHairstyleDescription: z.string().describe('A brief (1-2 sentences) description of the suggested hairstyle and why it fits the criteria.'),
  suggestedHairstyleImagePrompt: z.string().describe('A concise DALL-E or Stable Diffusion style prompt to generate an image of the suggested hairstyle, including details about the hairstyle itself and mention the face shape if relevant for visual representation. For example: "Photo of a man with a round face shape sporting a voluminous textured quiff, trendy, modern haircut." or "Close-up studio portrait of a professional-looking square-faced man with a classic side-part hairstyle."'),
});
export type SuggestHairstyleOutput = z.infer<typeof SuggestHairstyleOutputSchema>;

export async function suggestHairstyle(input: SuggestHairstyleInput): Promise<SuggestHairstyleOutput> {
  return suggestHairstyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHairstylePrompt',
  input: {schema: SuggestHairstyleInputSchema},
  output: {schema: SuggestHairstyleOutputSchema},
  prompt: `You are an expert hairstylist AI. Based on the user's face shape and preferred style type, suggest a suitable hairstyle.

Provide the following:
1.  'suggestedHairstyleName': The specific name of the hairstyle.
2.  'suggestedHairstyleDescription': A short, compelling description.
3.  'suggestedHairstyleImagePrompt': A concise prompt suitable for an image generation model to visualize the hairstyle on the given face shape.

User Face Shape: {{{faceShape}}}
User Preferred Style Type: {{{preferredStyleType}}}
`,
});

const suggestHairstyleFlow = ai.defineFlow(
  {
    name: 'suggestHairstyleFlow',
    inputSchema: SuggestHairstyleInputSchema,
    outputSchema: SuggestHairstyleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to provide a hairstyle suggestion.");
    }
    return output;
  }
);
