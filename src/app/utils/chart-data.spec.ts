import { describe, expect, it } from 'vitest';
import { Expense } from '../models/expenses.model';
import {
  averageMonth,
  categoryAverages,
  inRange,
  monthTotals,
  parseMonthName,
} from './chart-data';

// Synthetic months only.
const month = (id: string, MonthName: string, v: Partial<Expense>): Expense => ({
  id,
  MonthName,
  TotalWage: 1000,
  Supermarket: 0,
  Medical: 0,
  Personal: 0,
  EatingOut: 0,
  Utilities: 0,
  Takeaway: 0,
  Tickets: 0,
  Gaming: 0,
  Cats: 0,
  Travel: 0,
  Subscriptions: 0,
  Gym: 0,
  ...v,
});

const budgetFor = (name: string) => ({ Supermarket: 200, EatingOut: 100 })[name] ?? null;
const now = new Date(2026, 10, 6);

const EXPENSES = [
  month('c', 'November 2026', { Supermarket: 50 }),
  month('a', 'September 2026', { Supermarket: 180, EatingOut: 120 }),
  month('b', 'October 2026', { Supermarket: 220, EatingOut: 60 }),
  month('ALL', 'All Time', { Supermarket: 999 }),
];

describe('chart data', () => {
  it('reads month names', () => {
    expect(parseMonthName('October 2026')).toEqual({ year: 2026, month: 9 });
    expect(parseMonthName('All Time')).toBeNull();
  });

  it('orders months oldest first, drops the aggregate and flags the month in progress', () => {
    const months = monthTotals(EXPENSES, budgetFor, now);
    expect(months.map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(months[0]).toMatchObject({ spent: 300, budget: 300, saved: 700, current: false });
    expect(months[2].current).toBe(true);
  });

  it('keeps the newest months for a range', () => {
    const months = monthTotals(EXPENSES, budgetFor, now);
    expect(inRange(months, '6m').map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(inRange([...months, ...months, ...months, ...months, ...months], '12m')).toHaveLength(12);
  });

  it('averages finished months only', () => {
    const months = monthTotals(EXPENSES, budgetFor, now);
    expect(averageMonth(months)).toEqual({ spent: 290, saved: 710, count: 2 });
  });

  it('ranks categories by their monthly average', () => {
    const months = monthTotals(EXPENSES, budgetFor, now);
    const rows = categoryAverages(EXPENSES, months, budgetFor);
    expect(rows[0]).toEqual({ name: 'Supermarket', average: 200, budget: 200 });
    expect(rows[1]).toEqual({ name: 'EatingOut', average: 90, budget: 100 });
  });
});
