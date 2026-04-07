import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Log every non-asset request to trace the setup redirect source
  if (!path.startsWith('/_astro') && !path.match(/\.\w{1,5}$/)) {
    const hasSession = !!context.session;
    let sessionUser = null;
    try {
      sessionUser = await context.session?.get('user');
    } catch (e: any) {
      console.log(`[mw] session.get THREW on ${path}: ${e?.message}`);
    }
    console.log(`[mw] ${path} | session=${hasSession} | user=${!!sessionUser}`);
  }

  const response = await next();

  // Log if the response is a redirect to setup
  const location = response.headers.get('location');
  if (location?.includes('setup')) {
    console.log(`[mw] REDIRECT TO SETUP from ${path} (status=${response.status})`);
  }

  return response;
});
