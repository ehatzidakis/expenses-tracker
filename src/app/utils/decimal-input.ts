export function normalizeDecimalInput(value: string | null | undefined): string {
  if (value == null) return '';

  const trimmed = value.trim();
  if (trimmed === '') return '';

  const normalizedDots = trimmed.replace(/,/g, '.');
  const [wholePart, ...fractionParts] = normalizedDots.split('.');

  if (fractionParts.length === 0) {
    return wholePart || '';
  }

  return `${wholePart}.${fractionParts.join('')}`;
}

export function parseDecimalInput(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const normalized = normalizeDecimalInput(value);
  if (normalized === '' || normalized === '.' || normalized === '-.') return 0;

  const parsedValue = Number(normalized);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
