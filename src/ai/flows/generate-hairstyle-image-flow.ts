
'use server';
/**
 * @fileOverview A Genkit flow to generate an image based on a text prompt.
 *
 * - generateHairstyleImage - A function that handles image generation.
 * - GenerateHairstyleImageInput - The input type for the function.
 * - GenerateHairstyleImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHairstyleImageInputSchema = z.object({
  imagePrompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateHairstyleImageInput = z.infer<typeof GenerateHairstyleImageInputSchema>;

const GenerateHairstyleImageOutputSchema = z.object({
  imageDataURI: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateHairstyleImageOutput = z.infer<typeof GenerateHairstyleImageOutputSchema>;

export async function generateHairstyleImage(input: GenerateHairstyleImageInput): Promise<GenerateHairstyleImageOutput> {
  return generateHairstyleImageFlow(input);
}

const generateHairstyleImageFlow = ai.defineFlow(
  {
    name: 'generateHairstyleImageFlow',
    inputSchema: GenerateHairstyleImageInputSchema,
    outputSchema: GenerateHairstyleImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Specific model for image generation
      prompt: input.imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
        // Optional: Adjust safety settings if needed, otherwise defaults will be used
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        // ],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed or returned no media URL.');
    }
    
    // Gemini 2.0 Flash with IMAGE modality typically returns PNG.
    // The URL is already a data URI.
    return { imageDataURI: media.url };
  }
);
