import { env, createExecutionContext, waitOnExecutionContext, fetchMock } from 'cloudflare:test';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

// --- GitHub API fixtures ---------------------------------------------------

const USER_FIXTURE = {
	login: 'octocat',
	public_repos: 12,
	followers: 5,
	following: 3,
};

const REPOS_FIXTURE = [
	{ stargazers_count: 42, forks_count: 7, owner: { login: 'octocat' } },
	{ stargazers_count: 8, forks_count: 1, owner: { login: 'octocat' } },
];

const GRAPHQL_FIXTURE = {
	data: {
		user: {
			repositories: {
				nodes: [
					{
						name: 'repo-a',
						isFork: false,
						languages: {
							edges: [
								{ size: 1000, node: { name: 'TypeScript' } },
								{ size: 500, node: { name: 'CSS' } },
							],
						},
					},
				],
			},
		},
	},
};

const jsonHeaders = { 'content-type': 'application/json' };

function mockGitHubApi() {
	const api = fetchMock.get('https://api.github.com');
	api.intercept({ path: (path) => path.startsWith('/users/octocat/repos') }).reply(200, REPOS_FIXTURE, { headers: jsonHeaders });
	api.intercept({ path: (path) => path.startsWith('/users/octocat') }).reply(200, USER_FIXTURE, { headers: jsonHeaders });
	api.intercept({ method: 'POST', path: (path) => path.startsWith('/graphql') }).reply(200, GRAPHQL_FIXTURE, { headers: jsonHeaders });
}

beforeEach(() => {
	fetchMock.activate();
	// Any GitHub request that is not explicitly mocked must fail the test.
	fetchMock.disableNetConnect();
	mockGitHubApi();
});

afterEach(() => {
	fetchMock.deactivate();
});

async function fetchWorker(path: string): Promise<Response> {
	const request = new IncomingRequest(`http://example.com${path}`);
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

async function fetchWorkerWithIp(ip: string, path: string): Promise<Response> {
	const request = new IncomingRequest(`http://example.com${path}`, {
		headers: { 'CF-Connecting-IP': ip },
	});
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

// --- Tests -----------------------------------------------------------------

describe('rate limit', () => {
	it('blocks a client after exceeding the per-window limit', async () => {
		// Small limit for this test only; other tests send no client IP.
		env.RATE_LIMIT_MAX = 3;
		env.RATE_LIMIT_WINDOW_SECONDS = 60;

		const ip = '198.51.100.7';
		for (let i = 0; i < 3; i++) {
			const response = await fetchWorkerWithIp(ip, '/');
			expect(response.status).toBe(200);
		}

		const blocked = await fetchWorkerWithIp(ip, '/');
		expect(blocked.status).toBe(429);
		expect(blocked.headers.get('Retry-After')).toBe('60');
	});
});

describe('router', () => {
	it('returns a text greeting at the root', async () => {
		const response = await fetchWorker('/');
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('text/plain');
		expect(await response.text()).toBe('GitHub Stats API');
	});

	it('rejects /api without a username', async () => {
		const response = await fetchWorker('/api');
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Missing username');
	});

	it('rejects /api/top-langs without a username', async () => {
		const response = await fetchWorker('/api/top-langs');
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Missing username');
	});
});

describe('/api', () => {
	it('renders an SVG card with GitHub stats', async () => {
		const response = await fetchWorker('/api?username=octocat');
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');

		const body = await response.text();
		expect(body).toContain('<svg');
		expect(body).toContain('STARS');
		expect(body).toContain('50'); // total stars: 42 + 8
		expect(body).toContain('FORKS');
		expect(body).toContain('8'); // total forks: 7 + 1
		expect(body).toContain('12'); // repositories
		expect(body).toContain('5'); // followers
	});

	it('serves a repeated request from the edge cache', async () => {
		const first = await fetchWorker('/api?username=octocat');
		expect(first.headers.get('X-Cache-Status')).toBe('MISS');
		expect(first.headers.get('Cache-Control')).toBe('public, s-maxage=1800');

		const second = await fetchWorker('/api?username=octocat');
		expect(second.headers.get('X-Cache-Status')).toBe('HIT');
		expect(await second.text()).toBe(await first.text());
	});

	it('serves stale cached data while refreshing in the background', async () => {
		// Pre-seed KV with a 2-hour-old entry (fresh window is 1h, max age 24h).
		await env.STATS_CACHE.put(
			'stats:octocat',
			JSON.stringify({
				fetchedAt: Date.now() - 2 * 60 * 60 * 1000,
				data: {
					username: 'octocat',
					repositories: 12,
					followers: 5,
					following: 3,
					stars: 999,
					forks: 999,
				},
			}),
		);

		// Use a URL that was not edge-cached by earlier tests so the request
		// actually reaches the KV layer.
		const response = await fetchWorker('/api?username=octocat&title_color=111111');
		expect(response.status).toBe(200);

		const body = await response.text();
		expect(body).toContain('STARS');
		expect(body).toContain('999'); // stale stars from KV, not the mocked 50

		// The background refresh ran and persisted fresh data.
		const entry = await env.STATS_CACHE.get('stats:octocat', 'json');
		expect(entry.data.stars).toBe(50);
	});
});

describe('/api/top-langs', () => {
	it('renders a compact SVG with language percentages', async () => {
		const response = await fetchWorker('/api/top-langs?username=octocat&layout=compact');
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');

		const body = await response.text();
		expect(body).toContain('TOP LANGUAGES');
		expect(body).toContain('TypeScript');
		expect(body).toContain('CSS');
		expect(body).toContain('66.7'); // 1000 / 1500 bytes
		expect(body).toContain('33.3'); // 500 / 1500 bytes
	});

	it('clamps langs_count to the allowed range', async () => {
		const response = await fetchWorker('/api/top-langs?username=octocat&langs_count=999');
		expect(response.status).toBe(200);

		const body = await response.text();
		expect(body).toContain('TypeScript');
		expect(body).toContain('CSS');
	});
});
