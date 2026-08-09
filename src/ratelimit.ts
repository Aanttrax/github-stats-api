import type { Env } from './types';

/**
 * Rate limiting per client IP using KV counters with a sliding window
 * approximation. Blocks abusive clients with 429 before they hit GitHub.
 *
 * Fail-open by design: if KV is unavailable or the request has no client
 * IP, the request passes. The rate limit must never break the badge.
 */
export async function checkRateLimit(env: Env, request: Request): Promise<Response | null> {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) {
    return null;
  }

  const max = env.RATE_LIMIT_MAX ?? 120;
  const windowSeconds = env.RATE_LIMIT_WINDOW_SECONDS ?? 60;

  const key = `ratelimit:${ip}`;

  try {
    const current = (await env.STATS_CACHE.get<number>(key, 'json')) ?? 0;
    if (current >= max) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(windowSeconds),
          'Cache-Control': 'no-store',
        },
      });
    }
    await env.STATS_CACHE.put(key, String(current + 1), { expirationTtl: windowSeconds });
    return null;
  } catch {
    // Fail open: never block the badge because of a storage error.
    return null;
  }
}
