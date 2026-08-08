import { Octokit } from 'octokit';

import { withCache, withDataCache } from './cache';
import { getBooleanParam, getColorParam } from './params';
import { getRepositories } from './github';
import { createStatsSvg } from './svg/stats-card';
import type { Env, Stats } from './types';

async function getStats(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response('Missing username', {
      status: 400,
    });
  }

  return withCache(new Request(url.toString()), async () => {
    const showIcons = getBooleanParam(url.searchParams.get('show_icons'), true);
    const countPrivate = getBooleanParam(url.searchParams.get('count_private'), false);
    const hideBorder = getBooleanParam(url.searchParams.get('hide_border'), false);
    const titleColor = getColorParam(url.searchParams.get('title_color'), '#94e2d5');
    const iconColor = getColorParam(url.searchParams.get('icon_color'), '#cba6f7');
    const textColor = getColorParam(url.searchParams.get('text_color'), '#cdd6f4');
    const bgColor = getColorParam(url.searchParams.get('bg_color'), '#1e1e2e');

    try {
      const key = `stats:${username}${countPrivate ? ':private' : ''}`;
      const stats = await withDataCache(env, ctx, key, async () => {
        const octokit = new Octokit({
          auth: env.GITHUB_TOKEN,
        });

        const [user, repos] = await Promise.all([
          octokit.rest.users.getByUsername({
            username,
          }),
          getRepositories(octokit, username, countPrivate),
        ]);

        const totalStars = repos.reduce((total, repo) => total + Number(repo.stargazers_count ?? 0), 0);
        const totalForks = repos.reduce((total, repo) => total + Number(repo.forks_count ?? 0), 0);

        const repositories = countPrivate ? repos.length : user.data.public_repos;

        return {
          username: user.data.login,
          repositories,
          followers: user.data.followers,
          following: user.data.following,
          stars: totalStars,
          forks: totalForks,
        } satisfies Stats;
      });

      const svg = createStatsSvg(stats, {
        showIcons,
        hideBorder,
        titleColor,
        iconColor,
        textColor,
        bgColor,
      });

      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
        },
      });
    } catch (error) {
      console.error(error);

      return new Response('Failed to fetch GitHub data', {
        status: 500,
      });
    }
  });
}

export { getStats };
