import { escapeXml } from '../params';
import type { LanguageStats, TopLanguagesOptions } from '../types';
import { getLanguageColor, getLanguageInitial, polarToCartesian, svgFooter, svgHeader, titleSvg } from './helpers';

/**
 * 1. COMPACT
 */
function renderCompact(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 495;
  const rowHeight = 38;
  const height = 62 + languages.length * rowHeight;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += titleSvg('TOP LANGUAGES', options.titleColor);

  languages.forEach((language, index) => {
    const y = 65 + index * rowHeight;
    const color = getLanguageColor(language.name, index);

    const barWidth = (language.percentage / 100) * 240;

    svg += `
      <text
        x="28"
        y="${y + 15}"
        fill="${options.textColor}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="12"
        font-weight="600"
      >
        ${escapeXml(language.name)}
      </text>

      <rect
        x="145"
        y="${y + 5}"
        width="240"
        height="8"
        rx="4"
        fill="#30363D"
      />

      <rect
        x="145"
        y="${y + 5}"
        width="${barWidth}"
        height="8"
        rx="4"
        fill="${color}"
      />

      <text
        x="400"
        y="${y + 15}"
        fill="${options.textColor}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="11"
        text-anchor="end"
      >
        ${language.percentage.toFixed(1)}%
      </text>
    `;
  });

  svg += svgFooter();

  return svg;
}

/**
 * 2. DONUT
 */
function renderDonut(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 520;
  const height = 280;

  const cx = 145;
  const cy = 137;
  const radius = 76;
  const stroke = 20;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  /*
   * Definiciones:
   * - glow rojo
   * - sombra sutil
   */
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
          stdDeviation="5"
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
   * Título
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
      TOP LANGUAGES
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
   * Donut base
   */
  svg += `
    <circle
      cx="${cx}"
      cy="${cy}"
      r="${radius}"
      fill="none"
      stroke="#252525"
      stroke-width="${stroke}"
    />
  `;

  /*
   * Donut
   */
  let currentAngle = -90;

  languages.forEach((language, index) => {
    const percentage = language.percentage;

    const angle = percentage * 3.6;

    const start = polarToCartesian(cx, cy, radius, currentAngle);

    const end = polarToCartesian(cx, cy, radius, currentAngle + angle);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `
        M ${start.x} ${start.y}
        A ${radius} ${radius}
        0 ${largeArc} 1
        ${end.x} ${end.y}
      `;

    /*
     * El primer lenguaje tiene glow.
     */
    const filter = index === 0 ? `filter="url(#redGlow)"` : '';

    svg += `
        <path
          d="${path}"
          fill="none"
          stroke="${getLanguageColor(language.name, index)}"
          stroke-width="${stroke}"
          stroke-linecap="round"
          ${filter}
        />
      `;

    currentAngle += angle;
  });

  /*
   * Centro del donut
   */
  const primary = languages[0];

  svg += `
    <circle
      cx="${cx}"
      cy="${cy}"
      r="53"
      fill="#0D0D0D"
      filter="url(#softShadow)"
    />

    <text
      x="${cx}"
      y="${cy - 5}"
      text-anchor="middle"
      fill="#FFFFFF"
      font-family="Arial, Helvetica, sans-serif"
      font-size="22"
      font-weight="700"
    >
      ${primary?.percentage.toFixed(0) ?? 0}%
    </text>

    <text
      x="${cx}"
      y="${cy + 15}"
      text-anchor="middle"
      fill="#8A8A8A"
      font-family="Arial, Helvetica, sans-serif"
      font-size="9"
      letter-spacing="0.8"
    >
      ${escapeXml(primary?.name ?? '').toUpperCase()}
    </text>
  `;

  /*
   * Ranking
   */
  languages.slice(0, 10).forEach((language, index) => {
    const y = 65 + index * 20;

    const color = getLanguageColor(language.name, index);

    svg += `
          <circle
            cx="285"
            cy="${y}"
            r="4"
            fill="${color}"
            ${index === 0 ? 'filter="url(#redGlow)"' : ''}
          />

          <text
            x="298"
            y="${y + 4}"
            fill="#F5F5F5"
            font-family="Arial, Helvetica, sans-serif"
            font-size="11"
            font-weight="600"
          >
            ${escapeXml(language.name)}
          </text>

          <text
            x="490"
            y="${y + 4}"
            text-anchor="end"
            fill="#8A8A8A"
            font-family="Arial, Helvetica, sans-serif"
            font-size="10"
          >
            ${language.percentage.toFixed(1)}%
          </text>
        `;
  });

  /*
   * Línea decorativa roja
   */
  svg += `
  <rect
    x="28"
    y="246"
    width="80"
    height="2"
    rx="1"
    fill="url(#redGradient)"
    filter="url(#redGlow)"
  />

  <text
    x="118"
    y="250"
    fill="#555555"
    font-family="Arial, Helvetica, sans-serif"
    font-size="8"
    letter-spacing="1"
  >
    AANTTRAX
  </text>
`;
  svg += svgFooter();

  return svg;
}

/**
 * 3. MULTI DONUT
 */
function renderMultiDonut(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 495;
  const height = 220;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += titleSvg('TOP LANGUAGES', options.titleColor);

  const max = Math.min(languages.length, 5);

  for (let i = 0; i < max; i++) {
    const language = languages[i];

    const cx = 55 + i * 96;
    const cy = 112;
    const radius = 28;
    const stroke = 8;

    const color = getLanguageColor(language.name, i);

    const circumference = 2 * Math.PI * radius;

    const dash = circumference * (language.percentage / 100);

    svg += `
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="#30363D"
        stroke-width="${stroke}"
      />

      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${stroke}"
        stroke-dasharray="${dash} ${circumference}"
        stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"
      />

      <text
        x="${cx}"
        y="${cy + 4}"
        text-anchor="middle"
        fill="${options.textColor}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="11"
        font-weight="700"
      >
        ${language.percentage.toFixed(0)}%
      </text>

      <text
        x="${cx}"
        y="165"
        text-anchor="middle"
        fill="${options.textColor}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="9"
      >
        ${escapeXml(getLanguageInitial(language.name))}
      </text>
    `;
  }

  svg += svgFooter();

  return svg;
}

/**
 * 4. CARDS
 */
function renderCards(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 495;
  const height = 225;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += titleSvg('TOP LANGUAGES', options.titleColor);

  languages.slice(0, 6).forEach((language, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    const x = 25 + col * 225;
    const y = 52 + row * 53;

    const color = getLanguageColor(language.name, index);

    svg += `
        <rect
          x="${x}"
          y="${y}"
          width="210"
          height="43"
          rx="8"
          fill="#161B22"
          stroke="#30363D"
        />

        <circle
          cx="${x + 20}"
          cy="${y + 21}"
          r="5"
          fill="${color}"
        />

        <text
          x="${x + 34}"
          y="${y + 18}"
          fill="${options.textColor}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="11"
          font-weight="600"
        >
          ${escapeXml(language.name)}
        </text>

        <text
          x="${x + 34}"
          y="${y + 33}"
          fill="#8B949E"
          font-family="Arial, Helvetica, sans-serif"
          font-size="9"
        >
          ${language.percentage.toFixed(1)}%
        </text>
      `;
  });

  svg += svgFooter();

  return svg;
}

/**
 * 5. SPECTRUM
 */
function renderSpectrum(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 495;
  const height = 180;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += titleSvg('LANGUAGE DISTRIBUTION', options.titleColor);

  const x = 25;
  const y = 78;
  const totalWidth = 445;

  let currentX = x;

  languages.forEach((language, index) => {
    const segmentWidth = totalWidth * (language.percentage / 100);

    const color = getLanguageColor(language.name, index);

    svg += `
      <rect
        x="${currentX}"
        y="${y}"
        width="${segmentWidth}"
        height="30"
        fill="${color}"
      />
    `;

    if (segmentWidth > 35) {
      svg += `
        <text
          x="${currentX + segmentWidth / 2}"
          y="${y + 19}"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="Arial, Helvetica, sans-serif"
          font-size="9"
          font-weight="700"
        >
          ${language.percentage.toFixed(0)}%
        </text>
      `;
    }

    currentX += segmentWidth;
  });

  languages.forEach((language, index) => {
    const xPos = 30 + index * 88;

    svg += `
      <circle
        cx="${xPos}"
        cy="135"
        r="4"
        fill="${getLanguageColor(language.name, index)}"
      />

      <text
        x="${xPos + 9}"
        y="139"
        fill="${options.textColor}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="9"
      >
        ${escapeXml(language.name)}
      </text>
    `;
  });

  svg += svgFooter();

  return svg;
}

/**
 * 6. TREEMAP
 */
function renderTreemap(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 495;
  const height = 230;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += titleSvg('LANGUAGE MAP', options.titleColor);

  const data = languages.slice(0, 6);

  const availableWidth = 445;
  const availableHeight = 145;

  const first = data[0]?.percentage ?? 0;

  const firstWidth = availableWidth * (first / 100);

  svg += `
    <rect
      x="25"
      y="55"
      width="${Math.max(firstWidth, 100)}"
      height="${availableHeight}"
      rx="6"
      fill="${getLanguageColor(data[0]?.name ?? '', 0)}"
    />

    <text
      x="${25 + Math.max(firstWidth, 100) / 2}"
      y="125"
      text-anchor="middle"
      fill="#FFFFFF"
      font-family="Arial, Helvetica, sans-serif"
      font-size="14"
      font-weight="700"
    >
      ${escapeXml(data[0]?.name ?? '')}
    </text>

    <text
      x="${25 + Math.max(firstWidth, 100) / 2}"
      y="145"
      text-anchor="middle"
      fill="#FFFFFF"
      font-family="Arial, Helvetica, sans-serif"
      font-size="11"
    >
      ${data[0]?.percentage.toFixed(1) ?? 0}%
    </text>
  `;

  let currentX = 25 + Math.max(firstWidth, 100);

  const remaining = data.slice(1);

  remaining.forEach((language, index) => {
    const remainingWidth = availableWidth - Math.max(firstWidth, 100);

    const widthPer = remainingWidth / remaining.length;

    const color = getLanguageColor(language.name, index + 1);

    svg += `
        <rect
          x="${currentX}"
          y="55"
          width="${widthPer - 2}"
          height="${availableHeight}"
          rx="5"
          fill="${color}"
        />

        <text
          x="${currentX + widthPer / 2}"
          y="120"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="Arial, Helvetica, sans-serif"
          font-size="10"
          font-weight="700"
        >
          ${escapeXml(getLanguageInitial(language.name))}
        </text>

        <text
          x="${currentX + widthPer / 2}"
          y="140"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="Arial, Helvetica, sans-serif"
          font-size="9"
        >
          ${language.percentage.toFixed(0)}%
        </text>
      `;

    currentX += widthPer;
  });

  svg += svgFooter();

  return svg;
}

/**
 * 7. RADIAL
 */
function renderRadial(languages: LanguageStats[], options: TopLanguagesOptions): string {
  const width = 495;
  const height = 250;

  const cx = 150;
  const cy = 130;

  let svg = svgHeader(width, height, options.bgColor, options.hideBorder);

  svg += titleSvg('LANGUAGE RADAR', options.titleColor);

  const radius = 78;

  const points = languages.slice(0, 6).map((language, index, arr) => {
    const angle = (Math.PI * 2 * index) / arr.length - Math.PI / 2;

    const value = Math.max(language.percentage / 100, 0.08);

    return {
      x: cx + Math.cos(angle) * radius * value,

      y: cy + Math.sin(angle) * radius * value,
    };
  });

  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ');

  svg += `
    <polygon
      points="${polygon}"
      fill="rgba(255,59,48,0.25)"
      stroke="#FF3B30"
      stroke-width="2"
    />
  `;

  languages.slice(0, 6).forEach((language, index, arr) => {
    const angle = (Math.PI * 2 * index) / arr.length - Math.PI / 2;

    const x = cx + Math.cos(angle) * (radius + 35);

    const y = cy + Math.sin(angle) * (radius + 35);

    svg += `
        <circle
          cx="${x}"
          cy="${y}"
          r="4"
          fill="${getLanguageColor(language.name, index)}"
        />

        <text
          x="${x}"
          y="${y + 15}"
          text-anchor="middle"
          fill="${options.textColor}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="9"
        >
          ${escapeXml(getLanguageInitial(language.name))}
        </text>
      `;
  });

  svg += `
    <text
      x="315"
      y="75"
      fill="${options.textColor}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="11"
      font-weight="700"
    >
      DISTRIBUTION
    </text>
  `;

  languages.slice(0, 6).forEach((language, index) => {
    const y = 95 + index * 23;

    svg += `
        <circle
          cx="320"
          cy="${y - 4}"
          r="4"
          fill="${getLanguageColor(language.name, index)}"
        />

        <text
          x="332"
          y="${y}"
          fill="${options.textColor}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="10"
        >
          ${escapeXml(language.name)}
        </text>

        <text
          x="465"
          y="${y}"
          text-anchor="end"
          fill="#8B949E"
          font-family="Arial, Helvetica, sans-serif"
          font-size="10"
        >
          ${language.percentage.toFixed(1)}%
        </text>
      `;
  });

  svg += svgFooter();

  return svg;
}

/**
 * MAIN SVG GENERATOR
 */
function createTopLanguagesSvg(languages: LanguageStats[], options: TopLanguagesOptions): string {
  switch (options.layout.toLowerCase()) {
    case 'donut':
      return renderDonut(languages, options);

    case 'multi-donut':
      return renderMultiDonut(languages, options);

    case 'cards':
      return renderCards(languages, options);

    case 'spectrum':
      return renderSpectrum(languages, options);

    case 'treemap':
      return renderTreemap(languages, options);

    case 'radial':
      return renderRadial(languages, options);

    case 'compact':
    default:
      return renderCompact(languages, options);
  }
}

export { createTopLanguagesSvg };
