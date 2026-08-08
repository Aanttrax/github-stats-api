import type { Env } from './types';

// Freshness window: data younger than this is served without touching GitHub.
const DATA_TTL_MS = 60 * 60 * 1000; // 1 hour

// Maximum staleness: older data is discarded instead of served stale.
const DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DataCacheEntry<T> {
  fetchedAt: number;
  data: T;
}

async function withCache(request: Request, generate: () => Promise<Response>): Promise<Response> {
  const cache = caches.default;

  const cacheKey = new Request(request.url, {
    method: 'GET',
  });

  const cached = await cache.match(cacheKey);

  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set('X-Cache-Status', 'HIT');
    return response;
  }

  const response = await generate();

  if (!response.ok) {
    return response;
  }

  const cachedResponse = new Response(response.body, response);
  cachedResponse.headers.set('X-Cache-Status', 'MISS');
  cachedResponse.headers.set('Cache-Control', 'public, s-maxage=1800');

  await cache.put(cacheKey, cachedResponse.clone());

  return cachedResponse;
}

/**
 * Data-layer cache backed by KV.
 *
 * GitHub data is expensive (rate-limited), so it is cached per key (e.g. per
 * username) instead of per rendered URL. The cached entry stores the fetch
 * time so stale entries can still be served while a background refresh runs.
 */
async function withDataCache<T>(
  env: Env,
  ctx: ExecutionContext,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await env.STATS_CACHE.get<DataCacheEntry<T>>(key, 'json');

  if (cached && typeof cached.fetchedAt === 'number' && cached.data !== undefined) {
    const age = Date.now() - cached.fetchedAt;

    if (age < DATA_TTL_MS) {
      // Fresh: serve without touching GitHub.
      return cached.data;
    }

    if (age < DATA_MAX_AGE_MS) {
      // Stale but usable: serve it and refresh in the background so the next
      // request gets fresh data without making the badge wait.
      ctx.waitUntil(
        refresh().catch((error) => {
          console.error('Background cache refresh failed', error);
        }),
      );
      return cached.data;
    }
  }

  // No cache, or too stale to trust: fetch now and store.
  return refresh();

  async function refresh(): Promise<T> {
    const data = await fetcher();
    const entry: DataCacheEntry<T> = {
      fetchedAt: Date.now(),
      data,
    };
    await env.STATS_CACHE.put(key, JSON.stringify(entry), {
      expirationTtl: Math.ceil(DATA_MAX_AGE_MS / 1000),
    });
    return data;
  }
}

export { withCache, withDataCache };
