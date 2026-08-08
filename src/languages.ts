import { withCache } from './cache';
import { getBooleanParam, getColorParam } from './params';
import { getLanguagesGraphQL } from './github';
import { createTopLanguagesSvg } from './svg/top-languages';
import type { Env, LanguageStats } from './types';

async function getTopLanguages(url: URL, env: Env): Promise<Response> {
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response('Missing username', {
      status: 400,
    });
  }
  return withCache(new Request(url.toString()), async () => {
    const layout = url.searchParams.get('layout') ?? 'default';
    const hideBorder = getBooleanParam(url.searchParams.get('hide_border'), false);
    const titleColor = getColorParam(url.searchParams.get('title_color'), '#94e2d5');
    const textColor = getColorParam(url.searchParams.get('text_color'), '#cdd6f4');
    const bgColor = getColorParam(url.searchParams.get('bg_color'), '#1e1e2e');
    const langsCount = Math.min(Math.max(Number(url.searchParams.get('langs_count') ?? '5'), 1), 20);

    try {
      const languages = await getLanguagesGraphQL(username, env.GITHUB_TOKEN);
      const totalBytes = languages.reduce((total, language) => total + language.bytes, 0);

      const languageStats: LanguageStats[] = languages
        .map((language) => ({
          name: language.name,
          bytes: language.bytes,
          percentage: totalBytes ? (language.bytes / totalBytes) * 100 : 0,
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, langsCount);

      const svg = createTopLanguagesSvg(languageStats, {
        layout,
        hideBorder,
        titleColor,
        textColor,
        bgColor,
      });

      const response = new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
        },
      });

      return response;
    } catch (error) {
      console.error(error);

      return new Response('Failed to fetch language statistics', {
        status: 500,
      });
    }
  });
}

export { getTopLanguages };
