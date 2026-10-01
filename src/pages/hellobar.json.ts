// What this build carries, read by `npx site-kick hellobar status --url <origin>`.
// Prerendered: it reflects the deploy, and an invalid src/data/hellobar.json fails the build.
import { hellobarJsonResponse } from 'site-kick/lib/hellobar.js';
import hellobar from '../data/hellobar.json';

export const prerender = true;

export const GET = () => hellobarJsonResponse(hellobar);
