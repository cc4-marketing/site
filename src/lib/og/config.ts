/**
 * Shared tokens for the OG image engine. Mirrors the brand guidelines in
 * docs/brand-guidelines.md and the CSS custom properties in src/styles/global.css.
 *
 * Bumping OG_TEMPLATE_VERSION invalidates every hashed OG image URL globally,
 * which forces crawlers to re-fetch and the engine to re-render on demand.
 */

export const OG_DIMENSIONS = { width: 1200, height: 630 } as const;

export const OG_COLORS = {
  cream: '#F5F1E8',
  charcoal: '#2C2C2C',
  rust: '#B85C3C',
  olive: '#6B8E23',
  mustard: '#E8B923',
  plum: '#5C3A6B',
} as const;

export const OG_FONTS = {
  display: 'Righteous',
  body: 'Outfit',
} as const;

export const OG_TEMPLATE_VERSION = 1;

export const OG_SITE = {
  name: 'cc4.marketing',
  url: 'https://cc4.marketing',
} as const;
