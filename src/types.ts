interface Env {
  GITHUB_TOKEN?: string;
}

interface Stats {
  username: string;
  repositories: number;
  followers: number;
  following: number;
  stars: number;
  forks: number;
}

interface SvgOptions {
  showIcons: boolean;
  hideBorder: boolean;
  titleColor: string;
  iconColor: string;
  textColor: string;
  bgColor: string;
}

interface LanguageStats {
  name: string;
  bytes: number;
  percentage: number;
}

interface TopLanguagesOptions {
  layout: string;
  hideBorder: boolean;
  titleColor: string;
  textColor: string;
  bgColor: string;
}

export type { Env, LanguageStats, Stats, SvgOptions, TopLanguagesOptions };
