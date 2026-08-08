import type { Stats, SvgOptions } from '../types';

import { svgFooter, svgHeader } from './helpers';

function createStatsSvg(stats: Stats, options: SvgOptions): string {
  const width = 520;
  const height = 230;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += `
    <defs>

      <filter
        id="redGlow"
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur
          stdDeviation="4"
          result="blur"
        />

        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter
        id="softShadow"
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feDropShadow
          dx="0"
          dy="4"
          stdDeviation="5"
          flood-color="#000000"
          flood-opacity="0.45"
        />
      </filter>

      <linearGradient
        id="redGradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop
          offset="0%"
          stop-color="#FF5A52"
        />

        <stop
          offset="100%"
          stop-color="#B91C1C"
        />
      </linearGradient>

    </defs>
  `;

  /*
   * Header
   */
  svg += `
    <text
      x="28"
      y="35"
      fill="${options.titleColor}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="14"
      font-weight="700"
      letter-spacing="1.5"
    >
      AANTTRAX / GITHUB
    </text>

    <circle
      cx="485"
      cy="29"
      r="3"
      fill="#FF3B30"
      filter="url(#redGlow)"
    />
  `;

  /*
   * Métricas
   */
  const metrics = [
    {
      label: 'REPOSITORIES',
      value: stats.repositories,
    },
    {
      label: 'STARS',
      value: stats.stars,
    },
    {
      label: 'FOLLOWERS',
      value: stats.followers,
    },
    {
      label: 'FORKS',
      value: stats.forks,
    },
    {
      label: 'FOLLOWING',
      value: stats.following,
    },
  ];

  /*
   * Primera fila
   */
  const firstRow = metrics.slice(0, 3);

  firstRow.forEach((metric, index) => {
    const x = 90 + index * 170;

    svg += `
        <text
          x="${x}"
          y="85"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="Arial, Helvetica, sans-serif"
          font-size="25"
          font-weight="700"
        >
          ${metric.value}
        </text>

        <text
          x="${x}"
          y="103"
          text-anchor="middle"
          fill="#8A8A8A"
          font-family="Arial, Helvetica, sans-serif"
          font-size="8"
          font-weight="600"
          letter-spacing="1"
        >
          ${metric.label}
        </text>
      `;
  });

  /*
   * Segunda fila
   */
  const secondRow = metrics.slice(3);

  secondRow.forEach((metric, index) => {
    const x = 185 + index * 150;

    svg += `
        <text
          x="${x}"
          y="145"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="Arial, Helvetica, sans-serif"
          font-size="19"
          font-weight="700"
        >
          ${metric.value}
        </text>

        <text
          x="${x}"
          y="161"
          text-anchor="middle"
          fill="#8A8A8A"
          font-family="Arial, Helvetica, sans-serif"
          font-size="8"
          font-weight="600"
          letter-spacing="1"
        >
          ${metric.label}
        </text>
      `;
  });

  /*
   * Línea de separación
   */
  svg += `
    <line
      x1="28"
      y1="183"
      x2="492"
      y2="183"
      stroke="#252525"
      stroke-width="1"
    />
  `;

  /*
   * Branding inferior
   */
  svg += `
    <rect
      x="28"
      y="205"
      width="80"
      height="2"
      rx="1"
      fill="url(#redGradient)"
      filter="url(#redGlow)"
    />

    <text
      x="118"
      y="209"
      fill="#555555"
      font-family="Arial, Helvetica, sans-serif"
      font-size="8"
      letter-spacing="1"
    >
      FULL STACK · DEVOPS · DATA · AI
    </text>
  `;

  svg += svgFooter();

  return svg;
}

export { createStatsSvg };
