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

export { withCache };
