# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/` holds Astro routes (e.g., `src/pages/index.astro`, `src/pages/lessons/`).
- `src/components/` contains reusable UI components in `PascalCase.astro` (e.g., `src/components/Hero.astro`).
- `src/layouts/` defines shared page layouts.
- `src/styles/` stores global styles and design tokens.
- `src/content/` and `src/content.config.ts` define content collections and schemas.
- `public/` is for static assets served as-is (images, icons, downloads).

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Astro dev server with hot reload.
- `npm run build` builds the production site to `dist/`.
- `npm run preview` serves the production build locally for final checks.

## Coding Style & Naming Conventions
- Use the existing Astro component structure and keep components in `PascalCase.astro`.
- Match the local formatting in each file; no formatter or linter is enforced in this repo.
- Prefer concise, semantic class names and keep styles in `src/styles/` when they are shared.

## Testing Guidelines
- There is no automated test suite configured.
- Validate changes by running `npm run build` and checking pages in `npm run preview`.
- For UI changes, verify key routes like `/`, `/modules/`, and `/lessons/` in a browser.

## Commit & Pull Request Guidelines
- Follow the existing conventional commit style seen in history: `feat: ...`, `fix: ...`, `chore: ...`.
- Keep commit messages short and descriptive.
- PRs should include a summary of changes, linked issues if applicable, and screenshots or short clips for UI changes.

## Deployment Notes
- Deployments run via GitHub Actions to GitHub Pages on pushes to `main`.
- Avoid breaking changes in `src/pages/` without coordinating routing impacts.
