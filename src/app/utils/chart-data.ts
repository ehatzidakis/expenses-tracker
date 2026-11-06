import { Expense } from '../models/expenses.model';
import { CATEGORY_NAMES } from '../services/expense-state.service';

export type ChartRange = '6m' | '12m' | 'all';

export interface MonthTotal {
  id: string;
  monthName: string;
  /** "Nov" */
  short: string;
  year: number;
  /** 0–11 */
  month: number;
  spent: number;
  wage: number;
  /** Sum of today's category budgets (budgets are not stored per month). */
  budget: number;
  saved: number;
  /** The calendar month in progress, so its numbers are not final. */
  current: boolean;
}

export interface CategoryAverage {
  name: string;
  average: number;
  budget: number | null;
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** "November 2026" → { year: 2026, month: 10 }, or null when it can't be read. */
export function parseMonthName(name: string): { year: number; month: number } | null {
  const [label, yearText] = name.trim().split(/\s+/);
  const month = MONTHS.indexOf((label ?? '').toLowerCase());
  const year = Number(yearText);
  return month === -1 || !Number.isFinite(year) ? null : { year, month };
}

function spentIn(expense: Expense): number {
  return CATEGORY_NAMES.reduce(
    (sum, name) => sum + (Number(expense[name as keyof Expense]) || 0),
    0,
  );
}

/** One entry per month record, oldest first. */
export function monthTotals(
  expenses: Expense[],
  budgetFor: (category: string) => number | null,
  now: Date = new Date(),
): MonthTotal[] {
  const budget = CATEGORY_NAMES.reduce((sum, name) => sum + (budgetFor(name) ?? 0), 0);
  return expenses
    .filter((e) => e.id !== 'ALL')
    .map((e) => ({ e, when: parseMonthName(e.MonthName) }))
    .filter((x): x is { e: Expense; when: { year: number; month: number } } => x.when !== null)
    .sort((a, b) => a.when.year - b.when.year || a.when.month - b.when.month)
    .map(({ e, when }) => {
      const spent = spentIn(e);
      const wage = Number(e.TotalWage) || 0;
      return {
        id: e.id,
        monthName: e.MonthName,
        short: e.MonthName.slice(0, 3),
        year: when.year,
        month: when.month,
        spent,
        wage,
        budget,
        saved: wage - spent,
        current: when.year === now.getFullYear() && when.month === now.getMonth(),
      };
    });
}

/** The last 6 or 12 month records, or all of them. */
export function inRange(months: MonthTotal[], range: ChartRange): MonthTotal[] {
  if (range === 'all') return months;
  return months.slice(-(range === '6m' ? 6 : 12));
}

/** Finished months only: the month in progress would drag every average down. */
export function finished(months: MonthTotal[]): MonthTotal[] {
  return months.filter((m) => !m.current);
}

export function averageMonth(months: MonthTotal[]): { spent: number; saved: number; count: number } {
  const done = finished(months);
  if (!done.length) return { spent: 0, saved: 0, count: 0 };
  const spent = done.reduce((sum, m) => sum + m.spent, 0) / done.length;
  const saved = done.reduce((sum, m) => sum + m.saved, 0) / done.length;
  return { spent, saved, count: done.length };
}

/** Monthly average per category over the given finished months, biggest first. */
export function categoryAverages(
  expenses: Expense[],
  months: MonthTotal[],
  budgetFor: (category: string) => number | null,
): CategoryAverage[] {
  const ids = new Set(finished(months).map((m) => m.id));
  const records = expenses.filter((e) => ids.has(e.id));
  if (!records.length) return [];
  return CATEGORY_NAMES.map((name) => ({
    name,
    average:
      records.reduce((sum, e) => sum + (Number(e[name as keyof Expense]) || 0), 0) / records.length,
    budget: budgetFor(name),
  })).sort((a, b) => b.average - a.average);
}
