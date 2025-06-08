
'use server';
/**
 * @fileOverview A Genkit flow to generate an image attempting to show a user
 * with a suggested hairstyle, using their original photo as a base.
 *
 * - generateHairstyleTryOn - Generates the try-on image.
 * - GenerateHairstyleTryOnInput - Input type.
 * - GenerateHairstyleTryOnOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateHairstyleTryOnInputSchema = z.object({
  userPhotoDataUri: z
    .string()
    .describe(
      "The user's original photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  hairstyleDescription: z.string().describe('A description of the hairstyle to apply to the user in the photo. E.g., "a textured quiff", "long layers with curtain bangs", "a classic crew cut".'),
});
export type GenerateHairstyleTryOnInput = z.infer<typeof GenerateHairstyleTryOnInputSchema>;

export const GenerateHairstyleTryOnOutputSchema = z.object({
  generatedTryOnImageDataUri: z.string().describe("The generated try-on image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateHairstyleTryOnOutput = z.infer<typeof GenerateHairstyleTryOnOutputSchema>;

export async function generateHairstyleTryOn(input: GenerateHairstyleTryOnInput): Promise<GenerateHairstyleTryOnOutput> {
  return generateHairstyleTryOnFlow(input);
}

const generateHairstyleTryOnFlow = ai.defineFlow(
  {
    name: 'generateHairstyleTryOnFlow',
    inputSchema: GenerateHairstyleTryOnInputSchema,
    outputSchema: GenerateHairstyleTryOnOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Model capable of image-in-image generation
      prompt: [
        { media: { url: input.userPhotoDataUri } },
        { text: `Give the person in this photo a new hairstyle: ${input.hairstyleDescription}. Try to maintain their facial features. The new hairstyle should look natural for them.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
        // Optional: Adjust safety settings. Stricter settings might be needed for user-uploaded content.
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        //   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
        //   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
        //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
        // ],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation for try-on failed or returned no media URL.');
    }
    
    return { generatedTryOnImageDataUri: media.url };
  }
);
