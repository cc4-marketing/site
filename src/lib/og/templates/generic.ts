import { OG_COLORS, OG_SITE } from '../config';

export interface GenericTemplateInput {
  title: string;
  subtitle?: string;
  /** Accent color — defaults to rust */
  accent?: 'rust' | 'olive' | 'mustard' | 'plum';
  /** Short label shown as a pill in the top-right */
  badge?: string;
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
  if (title.length <= 25) return 112;
  if (title.length <= 40) return 96;
  if (title.length <= 60) return 80;
  return 64;
}

/**
 * Catch-all template used for the homepage, blog index, changelog,
 * authors, download, and brand-guide. Cream background to match the rest
 * of the site, with a colored offset panel behind the title.
 */
export function renderGenericTemplate(input: GenericTemplateInput): string {
  const title = sanitize(input.title);
  const subtitle = input.subtitle ? sanitize(input.subtitle) : '';
  const badge = input.badge ? sanitize(input.badge) : '';
  const accent = OG_COLORS[input.accent ?? 'rust'];
  const fontSize = titleFontSize(title);

  return `
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;background:${OG_COLORS.cream};padding:64px 80px;box-sizing:border-box;border:6px solid ${OG_COLORS.charcoal};">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div style="display:flex;background:${OG_COLORS.rust};color:${OG_COLORS.cream};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:24px;">${OG_SITE.name}</div>
        ${
          badge
            ? `<div style="display:flex;background:${OG_COLORS.olive};color:${OG_COLORS.cream};padding:8px 18px;font-family:Outfit;font-weight:700;font-size:18px;letter-spacing:2px;">${badge}</div>`
            : ''
        }
      </div>
      <div style="display:flex;flex-direction:column;position:relative;max-width:1040px;">
        <div style="display:flex;background:${accent};width:100%;height:100%;position:absolute;top:14px;left:14px;"></div>
        <div style="display:flex;flex-direction:column;background:${OG_COLORS.cream};padding:28px 36px;position:relative;border:3px solid ${OG_COLORS.charcoal};">
          <div style="display:flex;font-family:Righteous;font-size:${fontSize}px;color:${OG_COLORS.charcoal};line-height:1.05;">${title}</div>
          ${
            subtitle
              ? `<div style="display:flex;font-family:Outfit;font-weight:400;font-size:28px;color:${OG_COLORS.charcoal};margin-top:16px;line-height:1.4;max-width:920px;">${subtitle}</div>`
              : ''
          }
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
        <div style="display:flex;font-family:Outfit;font-weight:400;font-size:18px;color:${OG_COLORS.charcoal};opacity:0.65;letter-spacing:1px;">CC4.MARKETING</div>
        <div style="display:flex;align-items:center;">
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.rust};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.mustard};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.plum};"></div>
        </div>
      </div>
    </div>
  `;
}
