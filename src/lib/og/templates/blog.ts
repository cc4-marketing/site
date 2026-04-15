import { OG_COLORS, OG_SITE } from '../config';

export interface BylineForOg {
  displayName: string;
  roleLabel?: string | null;
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
    // Remove any literal tag-breaking chars after entity decode.
    .replace(/[<>]/g, '')
    .replace(/&(?!#?\w+;)/g, 'and')
    // Strip emoji + extended pictographic runs.
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{FE0F}]/gu, '')
    // Collapse whitespace introduced by stripping.
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title font size steps down when the title would wrap awkwardly. */
function titleFontSize(title: string): number {
  if (title.length <= 40) return 84;
  if (title.length <= 60) return 72;
  if (title.length <= 80) return 60;
  return 52;
}

/** Renders a comma-separated byline string, collapsing 5+ into "+N more". */
function formatBylines(bylines: BylineForOg[] | undefined): string {
  if (!bylines || bylines.length === 0) return 'CC4.Marketing Team';
  const names = bylines.map((b) => sanitize(b.displayName)).filter(Boolean);
  if (names.length === 0) return 'CC4.Marketing Team';
  if (names.length <= 3) return names.join(', ');
  const shown = names.slice(0, 3).join(', ');
  return `${shown} +${names.length - 3} more`;
}

function categoryLabel(category: string | undefined): string {
  return sanitize(category ?? 'Blog').toUpperCase();
}

/**
 * Renders the Satori-compatible HTML for a blog post OG card.
 * Brand-aligned: cream background, charcoal border, mustard title panel
 * with plum offset shadow, rust brand lockup.
 */
export function renderBlogTemplate(input: BlogTemplateInput): string {
  const title = sanitize(input.title);
  const bylineText = formatBylines(input.bylines);
  const category = categoryLabel(input.category);
  const fontSize = titleFontSize(title);

  return `
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;background:${OG_COLORS.cream};padding:64px 80px;box-sizing:border-box;border:6px solid ${OG_COLORS.charcoal};">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div style="display:flex;background:${OG_COLORS.rust};color:${OG_COLORS.cream};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:24px;">${OG_SITE.name}</div>
        <div style="display:flex;background:${OG_COLORS.olive};color:${OG_COLORS.cream};padding:8px 18px;font-family:Outfit;font-weight:700;font-size:18px;letter-spacing:2px;">${category}</div>
      </div>
      <div style="display:flex;flex-direction:column;position:relative;max-width:960px;">
        <div style="display:flex;background:${OG_COLORS.plum};width:100%;height:100%;position:absolute;top:14px;left:14px;"></div>
        <div style="display:flex;background:${OG_COLORS.mustard};padding:28px 36px;position:relative;border:3px solid ${OG_COLORS.charcoal};">
          <div style="display:flex;font-family:Righteous;font-size:${fontSize}px;color:${OG_COLORS.charcoal};line-height:1.05;">${title}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
        <div style="display:flex;flex-direction:column;">
          <div style="display:flex;font-family:Outfit;font-weight:400;font-size:18px;color:${OG_COLORS.charcoal};opacity:0.65;letter-spacing:1px;">WRITTEN BY</div>
          <div style="display:flex;font-family:Outfit;font-weight:700;font-size:28px;color:${OG_COLORS.charcoal};margin-top:4px;">${bylineText}</div>
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
