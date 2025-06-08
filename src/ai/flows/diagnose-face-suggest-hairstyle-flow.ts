
'use server';
/**
 * @fileOverview A Genkit flow to analyze a user's photo, determine face shape (implicitly),
 * and suggest a hairstyle based on the photo and preferred style type.
 *
 * - diagnoseFaceAndSuggestHairstyle - Analyzes photo and suggests hairstyle.
 * - DiagnoseFaceSuggestHairstyleInput - Input type.
 * - DiagnoseFaceSuggestHairstyleOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DiagnoseFaceSuggestHairstyleInputSchema = z.object({
  userPhotoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  preferredStyleType: z.string().describe('The user preferred style type (e.g., Casual, Trendy, Professional).'),
});
export type DiagnoseFaceSuggestHairstyleInput = z.infer<typeof DiagnoseFaceSuggestHairstyleInputSchema>;

export const DiagnoseFaceSuggestHairstyleOutputSchema = z.object({
  detectedFaceShape: z.string().describe('The AI-detected face shape from the photo (e.g., Round, Oval, Square). Keep it to a single common descriptor.'),
  suggestedHairstyleName: z.string().describe('The name of the suggested hairstyle. Be specific and creative, e.g., "Voluminous Textured Quiff", "Modern Slick Back".'),
  suggestedHairstyleDescription: z.string().describe('A brief (1-2 sentences) description of the suggested hairstyle and why it fits the criteria and detected face shape.'),
  // This prompt is for visualizing the HAIRSTYLE itself, not for the try-on with the user's face.
  // The try-on flow will construct its own prompt using the user's image and suggestedHairstyleName.
  hairstyleVisualizationImagePrompt: z.string().describe('A concise DALL-E or Stable Diffusion style prompt to generate an image of ONLY the suggested hairstyle itself, e.g., "Studio photo of a voluminous textured quiff hairstyle, trendy, modern haircut." or "Close-up of a classic side-part hairstyle." Focus on the hairstyle, not the person or face shape for this specific prompt.'),
});
export type DiagnoseFaceSuggestHairstyleOutput = z.infer<typeof DiagnoseFaceSuggestHairstyleOutputSchema>;

export async function diagnoseFaceAndSuggestHairstyle(input: DiagnoseFaceSuggestHairstyleInput): Promise<DiagnoseFaceSuggestHairstyleOutput> {
  return diagnoseFaceSuggestHairstyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseFaceSuggestHairstylePrompt',
  input: {schema: DiagnoseFaceSuggestHairstyleInputSchema},
  output: {schema: DiagnoseFaceSuggestHairstyleOutputSchema},
  prompt: `You are an expert hairstylist AI. Analyze the provided user's photo to understand their facial features. Based on these features and their preferred style type, suggest a suitable hairstyle.

Inputs:
- User's Photo: {{media url=userPhotoDataUri}}
- User Preferred Style Type: {{{preferredStyleType}}}

Output the following:
1.  'detectedFaceShape': A brief, common descriptor of the user's face shape as determined from the photo (e.g., Round, Oval, Square, Heart, Diamond, Long).
2.  'suggestedHairstyleName': The specific name of the hairstyle.
3.  'suggestedHairstyleDescription': A short, compelling description of why this hairstyle suits their features and preferred style.
4.  'hairstyleVisualizationImagePrompt': A concise prompt for an image generation model to visualize *only the hairstyle itself* (not on the user's face). Example: "Photo of a modern textured crop hairstyle, clean background."
`,
});

const diagnoseFaceSuggestHairstyleFlow = ai.defineFlow(
  {
    name: 'diagnoseFaceSuggestHairstyleFlow',
    inputSchema: DiagnoseFaceSuggestHairstyleInputSchema,
    outputSchema: DiagnoseFaceSuggestHairstyleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to provide a hairstyle suggestion based on the photo.");
    }
    return output;
  }
);
