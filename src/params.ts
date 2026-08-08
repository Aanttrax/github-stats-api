function getBooleanParam(value: string | null, defaultValue: boolean): boolean {
  if (value === null) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function getColorParam(value: string | null, defaultValue: string): string {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.startsWith('#') ? value : `#${value}`;

  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return defaultValue;
  }

  return normalized;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export { escapeXml, getBooleanParam, getColorParam };
