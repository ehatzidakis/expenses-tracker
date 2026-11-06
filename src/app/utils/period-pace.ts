const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export type MonthKind = 'current' | 'past' | 'future' | 'unknown';

export interface MonthTiming {
  kind: MonthKind;
  /** Day of the month today (current month only). */
  day: number;
  daysInMonth: number;
  /** Days still to go, today included (current month only). */
  daysLeft: number;
  /**
   * Share of the month that has passed by the end of today: 1 for past months, 0 for future
   * ones, null when the month can't be read.
   */
  pace: number | null;
}

/** Where a month like "October 2026" sits relative to today. */
export function monthTiming(monthName: string, now: Date = new Date()): MonthTiming {
  const [monthLabel, yearLabel] = monthName.trim().split(/\s+/);
  const monthIndex = MONTHS.indexOf((monthLabel ?? '').toLowerCase());
  const year = Number(yearLabel);
  if (monthIndex === -1 || !Number.isFinite(year)) {
    return { kind: 'unknown', day: 0, daysInMonth: 0, daysLeft: 0, pace: null };
  }

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const selected = year * 12 + monthIndex;
  const current = now.getFullYear() * 12 + now.getMonth();

  if (selected < current) {
    return { kind: 'past', day: daysInMonth, daysInMonth, daysLeft: 0, pace: 1 };
  }
  if (selected > current) {
    return { kind: 'future', day: 0, daysInMonth, daysLeft: daysInMonth, pace: 0 };
  }

  const day = now.getDate();
  return {
    kind: 'current',
    day,
    daysInMonth,
    daysLeft: daysInMonth - day + 1,
    pace: day / daysInMonth,
  };
}

export type BudgetStatus = 'over' | 'ahead' | 'full' | 'ok' | 'none' | 'quiet';

/**
 * How a category stands against its budget. "Ahead" means spent above where the month's pace
 * says it should be by today, but not over the budget yet.
 */
export function budgetStatus(amount: number, budget: number | null, pace: number | null): BudgetStatus {
  if (amount <= 0) return 'quiet';
  if (budget === null || budget <= 0) return 'none';
  if (amount > budget + 0.005) return 'over';
  if (amount >= budget - 0.005) return 'full';
  if (pace !== null && pace < 1 && amount > budget * pace + 0.005) return 'ahead';
  return 'ok';
}

/** Sort order for rows: trouble first. */
export const STATUS_RANK: Record<BudgetStatus, number> = {
  over: 0,
  ahead: 1,
  full: 2,
  ok: 3,
  none: 4,
  quiet: 5,
};

/** "EatingOut" → "Eating out". */
export function categoryLabel(name: string): string {
  const spaced = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Whole days covered by a date range, both ends included. */
export function daysInRange(start: Date, end: Date): number {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}
