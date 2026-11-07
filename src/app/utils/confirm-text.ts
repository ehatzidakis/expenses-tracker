/** "€1,234.50", for text built in code (templates use the number pipe). */
export function euros(amount: number): string {
  return '€' + amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "5 Nov 2026" from a date or a 'YYYY-MM-DD' string; '' when it can't be read. */
export function shortDate(value: Date | string | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value.slice(0, 10) + 'T12:00:00') : value;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
