import { handle } from '@astrojs/cloudflare/handler';

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext) {
    const response = await handle(request, env, ctx);
    return response;
  },
} satisfies ExportedHandler;
