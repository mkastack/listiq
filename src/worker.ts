import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';

const handler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, env: any, ctx: any) {
    // 1. Make env available globally for the Supabase client
    (globalThis as any).env = env;
    
    // 2. Pass it to the handler
    return handler(request, {
      context: {
        cloudflare: { env, ctx },
      },
    });
  },
};
