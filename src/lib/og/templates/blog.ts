import { OG_COLORS, OG_SITE } from '../config';

export interface BylineForOg {
  displayName: string;
  roleLabel?: string | null;
  /** Base64 data URI for the avatar image (already encoded upstream). */
  avatarDataUri?: string;
}

export interface BlogTemplateInput {
  title: string;
  excerpt?: string;
  bylines?: BylineForOg[];
  category?: string;
}

/**
 * Prepares text for injection into the Satori HTML template. workers-og
 * uses htmlparser2 which does NOT decode HTML entities back into
 * characters — "&amp;" would render as literal "&amp;" — so we:
 *   1. Decode common entities that appear in Emdash PortableText excerpts
 *   2. Strip tag-breaking characters (< > &) that could corrupt the parser
 *   3. Strip emoji and pictographic glyphs not covered by our fonts
 *
 * Result is safe to drop into an HTML text node without further escaping.
 */
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

/**
 * Title is smaller than the pre-avatar variant because the excerpt now
 * takes vertical space below it. Cap at ~2 visual lines for readability.
 */
function titleFontSize(title: string): number {
  if (title.length <= 40) return 68;
  if (title.length <= 60) return 58;
  if (title.length <= 80) return 50;
  return 44;
}

/** Truncate excerpt to roughly 2 lines at 24px (~130 chars). */
function clampExcerpt(excerpt: string): string {
  const clean = sanitize(excerpt);
  if (clean.length <= 130) return clean;
  return clean.slice(0, 127).replace(/[\s,;:.!?]+$/, '') + '…';
}

interface PrimaryByline {
  name: string;
  role: string;
  avatarDataUri?: string;
  initial: string;
}

function primaryByline(bylines: BylineForOg[] | undefined): PrimaryByline {
  if (!bylines || bylines.length === 0) {
    return { name: 'CC4.Marketing Team', role: 'cc4.marketing', initial: 'C' };
  }
  const first = bylines[0];
  const name = sanitize(first.displayName) || 'CC4.Marketing Team';
  const extraCount = bylines.length - 1;
  const roleBase = first.roleLabel ? sanitize(first.roleLabel) : 'Author';
  const role = extraCount > 0 ? `${roleBase} · +${extraCount} more` : roleBase;
  return {
    name,
    role,
    avatarDataUri: first.avatarDataUri,
    initial: name.charAt(0).toUpperCase() || 'C',
  };
}

function categoryLabel(category: string | undefined): string {
  return sanitize(category ?? 'Blog').toUpperCase();
}

function avatarBlock(byline: PrimaryByline): string {
  const size = 96;
  if (byline.avatarDataUri) {
    return `<div style="display:flex;width:${size}px;height:${size}px;border-radius:${size / 2}px;border:3px solid ${OG_COLORS.charcoal};background:${OG_COLORS.cream};overflow:hidden;margin-right:20px;flex-shrink:0;">
      <img src="${byline.avatarDataUri}" width="${size - 6}" height="${size - 6}" style="display:flex;width:${size - 6}px;height:${size - 6}px;object-fit:cover;" />
    </div>`;
  }
  // Initials fallback — rust circle, cream initial, charcoal ring
  return `<div style="display:flex;width:${size}px;height:${size}px;border-radius:${size / 2}px;border:3px solid ${OG_COLORS.charcoal};background:${OG_COLORS.rust};align-items:center;justify-content:center;margin-right:20px;flex-shrink:0;">
    <div style="display:flex;font-family:Righteous;font-size:42px;color:${OG_COLORS.cream};line-height:1;">${byline.initial}</div>
  </div>`;
}

/**
 * Renders the Satori-compatible HTML for a blog post OG card.
 * Brand-aligned: cream background, charcoal border, mustard title panel
 * with plum offset shadow, rust brand lockup. Now with a circular avatar
 * and excerpt subtitle in the byline footer.
 */
export function renderBlogTemplate(input: BlogTemplateInput): string {
  const title = sanitize(input.title);
  const excerpt = input.excerpt ? clampExcerpt(input.excerpt) : '';
  const byline = primaryByline(input.bylines);
  const category = categoryLabel(input.category);
  const fontSize = titleFontSize(title);

  return `
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;background:${OG_COLORS.cream};padding:48px 64px;box-sizing:border-box;border:6px solid ${OG_COLORS.charcoal};">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div style="display:flex;background:${OG_COLORS.rust};color:${OG_COLORS.cream};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:24px;">${OG_SITE.name}</div>
        <div style="display:flex;background:${OG_COLORS.olive};color:${OG_COLORS.cream};padding:8px 18px;font-family:Outfit;font-weight:700;font-size:18px;letter-spacing:2px;">${category}</div>
      </div>
      <div style="display:flex;flex-direction:column;position:relative;max-width:1040px;">
        <div style="display:flex;background:${OG_COLORS.plum};width:100%;height:100%;position:absolute;top:12px;left:12px;"></div>
        <div style="display:flex;flex-direction:column;background:${OG_COLORS.mustard};padding:24px 32px;position:relative;border:3px solid ${OG_COLORS.charcoal};">
          <div style="display:flex;font-family:Righteous;font-size:${fontSize}px;color:${OG_COLORS.charcoal};line-height:1.05;">${title}</div>
          ${
            excerpt
              ? `<div style="display:flex;font-family:Outfit;font-weight:400;font-size:22px;color:${OG_COLORS.charcoal};margin-top:14px;line-height:1.4;max-width:960px;">${excerpt}</div>`
              : ''
          }
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div style="display:flex;align-items:center;">
          ${avatarBlock(byline)}
          <div style="display:flex;flex-direction:column;">
            <div style="display:flex;font-family:Outfit;font-weight:400;font-size:16px;color:${OG_COLORS.charcoal};opacity:0.6;letter-spacing:1px;">WRITTEN BY</div>
            <div style="display:flex;font-family:Outfit;font-weight:700;font-size:28px;color:${OG_COLORS.charcoal};margin-top:2px;">${byline.name}</div>
            ${
              byline.role
                ? `<div style="display:flex;font-family:Outfit;font-weight:400;font-size:16px;color:${OG_COLORS.charcoal};opacity:0.65;margin-top:2px;">${byline.role}</div>`
                : ''
            }
          </div>
        </div>
        <div style="display:flex;align-items:center;">
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.rust};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.mustard};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.plum};"></div>
        </div>
      </div>
    </div>
  `;
}
