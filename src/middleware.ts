import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Debug: try to access the DB the same way Emdash middleware does
  if (!path.startsWith('/_emdash') && !path.startsWith('/_image') && !path.startsWith('/_astro')) {
    try {
      const { getDb } = await import('emdash/runtime');
      const db = await (getDb as any)();
      await db.selectFrom('_emdash_migrations').selectAll().limit(1).execute();
      console.log(`[debug-mw] DB check PASSED for ${path}`);
    } catch (e: any) {
      console.log(`[debug-mw] DB check FAILED for ${path}: ${e?.message || e}`);
    }
  }

  return next();
});
