
import { config } from 'dotenv';
config();

// Commented out as booking process simplified, AI slot suggestion not currently used.
// import '@/ai/flows/suggest-time-slots.ts'; 

// New flows for hairstyle suggestion and image generation
import '@/ai/flows/suggest-hairstyle-flow';
import '@/ai/flows/generate-hairstyle-image-flow';
