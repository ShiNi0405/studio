
// src/config/hairstyleOptions.ts

export interface HaircutOptionConfig {
  id: string; // e.g., "men-crew-cut"
  name: string; // e.g., "Crew Cut"
  gender: 'men' | 'women';
  isCustom?: boolean; // True if this is a generic "Custom" option
  defaultImageHint?: string; // For AI hint on placeholder images
  exampleImageUrl?: string; // For display in banks
}

export const MENS_HAIRCUT_OPTIONS: HaircutOptionConfig[] = [
  { id: 'men-crew-cut', name: 'Crew Cut', gender: 'men', defaultImageHint: 'men crew cut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Crew+Cut' },
  { id: 'men-fade', name: 'Fade', gender: 'men', defaultImageHint: 'men fade haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Fade' },
  { id: 'men-quiff', name: 'Quiff', gender: 'men', defaultImageHint: 'men quiff hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Quiff' },
  { id: 'men-undercut', name: 'Undercut', gender: 'men', defaultImageHint: 'men undercut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Undercut' },
  { id: 'men-buzz-cut', name: 'Buzz Cut', gender: 'men', defaultImageHint: 'men buzz cut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Buzz' },
  { id: 'men-side-part', name: 'Side Part', gender: 'men', defaultImageHint: 'men side part', exampleImageUrl: 'https://placehold.co/100x100.png?text=Side+Part' },
  { id: 'men-taper-cut', name: 'Taper Cut', gender: 'men', defaultImageHint: 'men taper cut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Taper' },
  { id: 'men-slick-back', name: 'Slick Back', gender: 'men', defaultImageHint: 'men slick back', exampleImageUrl: 'https://placehold.co/100x100.png?text=Slick+Back' },
  { id: 'men-pompadour', name: 'Pompadour', gender: 'men', defaultImageHint: 'men pompadour', exampleImageUrl: 'https://placehold.co/100x100.png?text=Pompadour' },
  { id: 'men-custom', name: 'Custom Men\'s Haircut', gender: 'men', isCustom: true, defaultImageHint: 'men custom haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Custom+Men' },
];

export const WOMENS_HAIRCUT_OPTIONS: HaircutOptionConfig[] = [
  { id: 'women-bob', name: 'Bob Cut', gender: 'women', defaultImageHint: 'women bob cut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Bob' },
  { id: 'women-pixie', name: 'Pixie Cut', gender: 'women', defaultImageHint: 'women pixie cut hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Pixie' },
  { id: 'women-layers', name: 'Long Layers', gender: 'women', defaultImageHint: 'women long layers hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Layers' },
  { id: 'women-bangs', name: 'Bangs (Fringe)', gender: 'women', defaultImageHint: 'women bangs hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Bangs' },
  { id: 'women-lob', name: 'Lob (Long Bob)', gender: 'women', defaultImageHint: 'women lob hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Lob' },
  { id: 'women-shag', name: 'Shag Haircut', gender: 'women', defaultImageHint: 'women shag haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Shag' },
  { id: 'women-balayage', name: 'Balayage Color', gender: 'women', defaultImageHint: 'women balayage hair', exampleImageUrl: 'https://placehold.co/100x100.png?text=Balayage' },
  { id: 'women-updo', name: 'Updo Styling', gender: 'women', defaultImageHint: 'women updo hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Updo' },
  { id: 'women-perms', name: 'Perm', gender: 'women', defaultImageHint: 'women perm hairstyle', exampleImageUrl: 'https://placehold.co/100x100.png?text=Perm' },
  { id: 'women-custom', name: 'Custom Women\'s Haircut/Styling', gender: 'women', isCustom: true, defaultImageHint: 'women custom haircut', exampleImageUrl: 'https://placehold.co/100x100.png?text=Custom+Women' },
];

export const ALL_HAIRCUT_OPTIONS = [...MENS_HAIRCUT_OPTIONS, ...WOMENS_HAIRCUT_OPTIONS];

export const getHaircutOptionById = (id: string): HaircutOptionConfig | undefined => {
  return ALL_HAIRCUT_OPTIONS.find(opt => opt.id === id);
}
