import { escapeXml } from '../params';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Java: '#ED8B00',
  C: '#A8B9CC',
  'C++': '#00599C',
  'C#': '#68217A',
  Go: '#00ADD8',
  Rust: '#DEA584',
  PHP: '#777BB4',
  Ruby: '#CC342D',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#0175C2',
  HTML: '#E34F26',
  CSS: '#1572B6',
  SCSS: '#CF649A',
  Shell: '#89E051',
  Dockerfile: '#2496ED',
  Vue: '#41B883',
  Svelte: '#FF3E00',
  'Jupyter Notebook': '#F37626',
};

function getLanguageColor(language: string, index: number): string {
  if (LANGUAGE_COLORS[language]) {
    return LANGUAGE_COLORS[language];
  }

  const fallback = ['#FF3B30', '#FF453A', '#FF6961', '#FF8A80', '#D70015', '#B91C1C', '#991B1B', '#7F1D1D'];
  return fallback[index % fallback.length];
}

function getLanguageInitial(language: string): string {
  if (language === 'TypeScript') return 'TS';
  if (language === 'JavaScript') return 'JS';
  if (language === 'Jupyter Notebook') return 'NB';

  return language.substring(0, 2).toUpperCase();
}

function svgHeader(width: number, height: number, bgColor: string, hideBorder: boolean): string {
  const border = hideBorder ? '' : `stroke="#30363D" stroke-width="1"`;

  return `
<svg
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  xmlns="http://www.w3.org/2000/svg"
>
  <rect
    width="${width}"
    height="${height}"
    rx="12"
    fill="${bgColor}"
    ${border}
  />
`;
}

function svgFooter(): string {
  return `</svg>`;
}

function titleSvg(title: string, color: string): string {
  return `
<text
  x="28"
  y="34"
  fill="${color}"
  font-family="Arial, Helvetica, sans-serif"
  font-size="15"
  font-weight="700"
>
  ${escapeXml(title)}
</text>
`;
}

/**
 * Helper para el donut
 */
function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

export { LANGUAGE_COLORS, getLanguageColor, getLanguageInitial, polarToCartesian, svgFooter, svgHeader, titleSvg };
