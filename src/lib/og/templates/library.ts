import { OG_COLORS, OG_SITE } from '../config';

export interface LibraryTemplateInput {
  /** Entry name, e.g. "GA4 Question Answerer" */
  name: string;
  /** Category label, e.g. "Analytics & Data" */
  categoryLabel: string;
  /** Type label, e.g. "Slash Command" */
  typeLabel: string;
  /** One-line tagline shown under the name */
  tagline?: string;
}

function sanitize(text: string): string {
  return text
    .replace(/&amp;/g, 'and')
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/&(?!#?\w+;)/g, 'and')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFontSize(title: string): number {
  if (title.length <= 24) return 92;
  if (title.length <= 40) return 76;
  if (title.length <= 60) return 60;
  return 48;
}

/**
 * Marketing Library entry OG template. Rust background to distinguish it from
 * the plum course lessons, cream name, mustard category pill, olive type pill.
 */
export function renderLibraryTemplate(input: LibraryTemplateInput): string {
  const name = sanitize(input.name);
  const category = sanitize(input.categoryLabel);
  const type = sanitize(input.typeLabel);
  const tagline = input.tagline ? sanitize(input.tagline) : '';
  const fontSize = titleFontSize(name);

  return `
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;background:${OG_COLORS.rust};padding:64px 80px;box-sizing:border-box;border:6px solid ${OG_COLORS.charcoal};">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div style="display:flex;background:${OG_COLORS.cream};color:${OG_COLORS.charcoal};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:24px;">${OG_SITE.name}</div>
        <div style="display:flex;background:${OG_COLORS.mustard};color:${OG_COLORS.charcoal};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:20px;letter-spacing:2px;border:3px solid ${OG_COLORS.charcoal};">${category}</div>
      </div>
      <div style="display:flex;flex-direction:column;max-width:1040px;">
        <div style="display:flex;font-family:Righteous;font-size:${fontSize}px;color:${OG_COLORS.cream};line-height:1.05;">${name}</div>
        ${
          tagline
            ? `<div style="display:flex;font-family:Outfit;font-weight:400;font-size:26px;color:${OG_COLORS.cream};opacity:0.9;margin-top:24px;max-width:900px;line-height:1.4;">${tagline}</div>`
            : ''
        }
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
        <div style="display:flex;align-items:center;">
          <div style="display:flex;background:${OG_COLORS.olive};color:${OG_COLORS.cream};padding:8px 18px;font-family:Outfit;font-weight:700;font-size:18px;margin-right:12px;">${type}</div>
          <div style="display:flex;font-family:Outfit;font-weight:400;font-size:18px;color:${OG_COLORS.cream};opacity:0.7;letter-spacing:1px;">MARKETING LIBRARY</div>
        </div>
        <div style="display:flex;align-items:center;">
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.cream};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.mustard};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.plum};"></div>
        </div>
      </div>
    </div>
  `;
}
