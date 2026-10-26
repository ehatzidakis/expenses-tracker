import { todayDateInputValue } from '../components/create-transaction.component/create-transaction.models';

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Moves a `YYYY-MM-DD` date input value by the given number of days.
 * Works in UTC so time zones and DST never cause an off-by-one day.
 * An empty or invalid value starts from today.
 */
export function shiftDateInputValue(value: string, days: number): string {
  const match = DATE_INPUT_PATTERN.exec(value) ?? DATE_INPUT_PATTERN.exec(todayDateInputValue());
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days));
  return date.toISOString().slice(0, 10);
}
