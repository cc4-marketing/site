// What this deploy carries, read by `npx site-kick hellobar status --url <origin>`.
// SSR, not prerendered: at build time the EmDash middleware answers "Database migrations are
// required" (CI has no migrated local D1) and that text was written into the static file.
import { hellobarJsonResponse } from 'site-kick/lib/hellobar.js';
import hellobar from '../data/hellobar.json';

export const prerender = false;

export const GET = () => {
  const res = hellobarJsonResponse(hellobar);
  res.headers.set('cache-control', 'public, max-age=300');
  return res;
};
