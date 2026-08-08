import { getStats } from './stats';
import { getTopLanguages } from './languages';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api') {
      return getStats(url, env, ctx);
    }

    if (url.pathname === '/api/top-langs' || url.pathname === '/api/top-langs/') {
      return getTopLanguages(url, env, ctx);
    }
    return new Response('GitHub Stats API', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
};
