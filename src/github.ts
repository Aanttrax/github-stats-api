import { Octokit } from 'octokit';

import type { LanguageStats } from './types';

async function getRepositories(octokit: Octokit, username: string, countPrivate: boolean) {
  if (countPrivate) {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all',
      affiliation: 'owner',
      per_page: 100,
      sort: 'updated',
    });

    return data.filter((repo) => {
      return repo.owner?.login?.toLowerCase() === username.toLowerCase();
    });
  }

  const { data } = await octokit.rest.repos.listForUser({
    username,
    per_page: 100,
    sort: 'updated',
  });

  return data;
}

interface GraphQLLanguage {
  name: string;
  size: number;
}

interface GraphQLRepository {
  name: string;
  isFork: boolean;
  languages: {
    edges: Array<{
      size: number;
      node: GraphQLLanguage;
    }>;
  };
}

interface GraphQLResponse {
  data?: {
    user?: {
      repositories: {
        nodes: GraphQLRepository[];
      };
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

async function getLanguagesGraphQL(username: string, token?: string): Promise<LanguageStats[]> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        repositories(
          first: 100
          ownerAffiliations: OWNER
          privacy: PUBLIC
          isFork: false
        ) {
          nodes {
            name
            isFork
            languages(
              first: 20
              orderBy: { field: SIZE, direction: DESC }
            ) {
              edges {
                size
                node {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'github-stats-api',
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      query,
      variables: {
        username,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status}`);
  }

  const result = (await response.json()) as GraphQLResponse;

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(', '));
  }

  const repositories = result.data?.user?.repositories.nodes ?? [];

  const languages = new Map<string, number>();

  for (const repository of repositories) {
    if (repository.isFork) {
      continue;
    }

    for (const edge of repository.languages.edges) {
      const current = languages.get(edge.node.name) ?? 0;

      languages.set(edge.node.name, current + edge.size);
    }
  }

  return [...languages.entries()].map(([name, bytes]) => ({
    name,
    bytes,
    percentage: 0,
  }));
}

export { getLanguagesGraphQL, getRepositories };
