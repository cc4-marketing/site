import righteousRegular from './fonts/Righteous-Regular.ttf';
import outfitRegular from './fonts/Outfit-Regular.woff';
import outfitBold from './fonts/Outfit-Bold.woff';

export interface OgFont {
  name: string;
  data: Uint8Array;
  weight: 400 | 500 | 600 | 700;
  style: 'normal' | 'italic';
}

/**
 * Fonts bundled with the worker and passed to Satori.
 *
 * Righteous 400 is the only weight Righteous ships in. Outfit is a variable
 * font upstream, but we ship static 400/700 WOFFs from the fontsource CDN
 * (Latin subset, ~18 KB each) — Satori doesn't handle variable fonts well.
 */
export function getOgFonts(): OgFont[] {
  return [
    { name: 'Righteous', data: righteousRegular, weight: 400, style: 'normal' },
    { name: 'Outfit', data: outfitRegular, weight: 400, style: 'normal' },
    { name: 'Outfit', data: outfitBold, weight: 700, style: 'normal' },
  ];
}
