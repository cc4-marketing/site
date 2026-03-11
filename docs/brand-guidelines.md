# Brand Guidelines: Claude Code for Marketers (CC4.Marketing)

This document outlines the core brand identity for CC4.Marketing, including visual design principles, voice & tone rules, and usage examples.

## 1. Visual Identity

### Design Direction
**Retro-Futuristic:** Blending 90s/early 2000s tech aesthetics with modern, clean layouts. It feels nostalgic yet cutting-edge—like the terminal has come to life.

### Colors
**Core Colors:**
- **Rust (#B85C3C):** Primary accent. Used for primary buttons, important links, and active states. (Dark mode: `#FF8866`)
- **Olive (#6B8E23):** Secondary accent. Used for secondary elements, callouts, and success states.
- **Mustard (#E8B923):** Highlight color. Used for badges, shadow effects on buttons, and drawing attention. (Dark mode: `#FFD147`)
- **Plum (#5C3A6B):** Deep accent. Used for dark gradients (like module sections) and subtle shadows.

**Neutrals:**
- **Cream (#F5F1E8):** Default light mode background.
- **Charcoal (#2C2C2C):** Primary text color in light mode, primary background in dark mode.

### Typography
- **Headings (Display):** `Righteous, serif`
  - *Usage:* H1-H6, section labels, big numbers. Creates the retro-tech vibe.
- **Body:** `Outfit, sans-serif`
  - *Usage:* Paragraphs, buttons, UI elements. Keeps reading smooth and modern.

### Spacing & Elements
- **Shadows & Borders:** Use solid, hard-edged drop shadows (e.g., `8px 8px 0 #2C2C2C`) and thick borders (3px solid charcoal) instead of soft, blurry CSS shadows. This reinforces the chunky, retro look.
- **Animations:** Subtle interactions (`hover: translate(-4px, -4px)`) combined with the solid shadows make elements feel like physical retro buttons being pressed.

---

## 2. Voice & Tone

### Personality
**"The 10x Mentor"**
Professional but approachable, deeply knowledgeable, highly actionable, and encouraging. We don't use fluff; we respect the marketer's time.

### Voice Rules
- **Direct & Action-Oriented:** Start headers and CTAs with strong verbs (e.g., "Master AI Workflows", "Copy System Prompt").
- **Tech-Savvy but Accessible:** Use AI terminology correctly (agents, system prompts, context windows) but always tie it back to practical marketing outcomes (campaigns, briefs, SEO).
- **Confident & Empowering:** Focus on how AI *amplifies* human creativity, rather than replacing it.

### Do's and Don'ts
| **Do** | **Don't** |
| :--- | :--- |
| **Do** focus on the outcome: "Ship campaigns 10x faster." | **Don't** sound robotic or overly academic about LLMs. |
| **Do** use formatting smartly: Use bolding and lists for scannability. | **Don't** write walls of text without visual breaks. |
| **Do** use empowering language: "Build your AI team." | **Don't** use hype-words without backing them up. |

---

## 3. Usage Guidelines

| Context | Style Goal | Example |
| :--- | :--- | :--- |
| **Headlines** | Benefit-focused, punchy | "Work 10x Faster In Claude Code." |
| **Body Copy** | Clear, concise, structured | "Claude guides you through each lesson. You create real marketing files as you learn." |
| **CTAs** | Action-oriented, direct | "Download Course →", "Start Module 0" |
| **Error/Empty States** | Helpful, encouraging | "Looks like you haven't started this module yet. Type `/start` to begin." |

---

## 4. Quick Reference for Contributors

When building new components or writing content for CC4.Marketing:
1. **Stick to the retro-futuristic style:** Hard shadows, thick borders, Righteous for headers.
2. **Use Semantic Classes:** Reuse `.btn-primary`, `.btn-secondary`, `.section-header`.
3. **Respect Dark Mode:** Ensure your new styles use the CSS variables (`--bg-primary`, `--text-primary`) so they swap correctly.
4. **Keep Copy Tight:** If a paragraph is longer than 3 sentences, consider breaking it into a bulleted list or adding a bold subhead.
