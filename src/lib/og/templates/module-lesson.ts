import { OG_COLORS, OG_SITE } from '../config';

export interface ModuleLessonTemplateInput {
  module: number;
  lesson: number;
  title: string;
  description?: string;
  duration?: string;
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
  if (title.length <= 30) return 96;
  if (title.length <= 50) return 80;
  if (title.length <= 70) return 64;
  return 52;
}

/**
 * Module lesson OG template. Plum background (course-section feel, matches
 * the site's module list), mustard lesson pill, cream title.
 */
export function renderModuleLessonTemplate(input: ModuleLessonTemplateInput): string {
  const title = sanitize(input.title);
  const description = input.description ? sanitize(input.description) : '';
  const fontSize = titleFontSize(title);
  const durationBadge = input.duration ? sanitize(input.duration) : '';

  return `
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;background:${OG_COLORS.plum};padding:64px 80px;box-sizing:border-box;border:6px solid ${OG_COLORS.charcoal};">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <div style="display:flex;background:${OG_COLORS.cream};color:${OG_COLORS.charcoal};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:24px;">${OG_SITE.name}</div>
        <div style="display:flex;background:${OG_COLORS.mustard};color:${OG_COLORS.charcoal};padding:10px 22px;font-family:Outfit;font-weight:700;font-size:20px;letter-spacing:2px;border:3px solid ${OG_COLORS.charcoal};">MODULE ${input.module} · LESSON ${input.lesson}</div>
      </div>
      <div style="display:flex;flex-direction:column;max-width:1040px;">
        <div style="display:flex;font-family:Righteous;font-size:${fontSize}px;color:${OG_COLORS.cream};line-height:1.05;">${title}</div>
        ${
          description
            ? `<div style="display:flex;font-family:Outfit;font-weight:400;font-size:24px;color:${OG_COLORS.cream};opacity:0.85;margin-top:24px;max-width:880px;line-height:1.4;">${description}</div>`
            : ''
        }
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
        <div style="display:flex;align-items:center;">
          ${
            durationBadge
              ? `<div style="display:flex;background:${OG_COLORS.rust};color:${OG_COLORS.cream};padding:8px 18px;font-family:Outfit;font-weight:700;font-size:18px;margin-right:12px;">${durationBadge}</div>`
              : ''
          }
          <div style="display:flex;font-family:Outfit;font-weight:400;font-size:18px;color:${OG_COLORS.cream};opacity:0.65;letter-spacing:1px;">INTERACTIVE LESSON</div>
        </div>
        <div style="display:flex;align-items:center;">
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.rust};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.mustard};margin-right:10px;"></div>
          <div style="display:flex;width:18px;height:18px;background:${OG_COLORS.cream};"></div>
        </div>
      </div>
    </div>
  `;
}
