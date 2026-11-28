import { describe, expect, it } from 'vitest';
import { Expense } from '../models/expenses.model';
import {
  averageMonth,
  categoryAverages,
  categorySwings,
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

  describe('categorySwings', () => {
    const SWING_EXPENSES = [
      month('m1', 'August 2026', { Supermarket: 100, Gym: 50 }),
      month('m2', 'September 2026', { Supermarket: 200, Gym: 50 }),
      month('m3', 'October 2026', { Supermarket: 300, Gym: 50, EatingOut: 90 }),
      month('m4', 'November 2026', { Supermarket: 5000 }),
    ];
    const months = monthTotals(SWING_EXPENSES, budgetFor, now);

    it('ranks used categories least steady first, over finished months only', () => {
      const rows = categorySwings(SWING_EXPENSES, months);
      expect(rows.map((r) => r.name)).toEqual(['EatingOut', 'Supermarket', 'Gym']);
      expect(rows[1]).toEqual({ name: 'Supermarket', mean: 200, sd: 100, cv: 0.5, low: 100, high: 300 });
      expect(rows[2]).toMatchObject({ name: 'Gym', mean: 50, sd: 0, cv: 0 });
    });

    it('counts empty months as zero and floors the usual range at zero', () => {
      const eatingOut = categorySwings(SWING_EXPENSES, months)[0];
      expect(eatingOut.mean).toBe(30);
      expect(eatingOut.sd).toBeCloseTo(Math.sqrt(2700));
      expect(eatingOut.cv).toBeCloseTo(Math.sqrt(2700) / 30);
      expect(eatingOut.low).toBe(0);
    });

    it('needs three finished months', () => {
      expect(categorySwings(SWING_EXPENSES, months.slice(1))).toEqual([]);
    });
  });
});

describe('budgets that changed over time', () => {
  const now = new Date(2026, 10, 28);
  const records = [
    month('feb', 'February 2026', { Gym: 70 }),
    month('jul', 'July 2026', { Gym: 70 }),
  ];
  // Gym was 100 in February 2026 and 62.50 from March 2026.
  const budgetFor = (name: string, monthName?: string) =>
    name === 'Gym' ? (monthName === 'February 2026' ? 100 : 62.5) : null;

  it('gives each month its own total budget', () => {
    const months = monthTotals(records, budgetFor, now);
    expect(months.map((m) => m.budget)).toEqual([100, 62.5]);
  });

  it('compares a category average with the average of those months’ budgets', () => {
    const months = monthTotals(records, budgetFor, now);
    const gym = categoryAverages(records, months, budgetFor).find((row) => row.name === 'Gym');
    expect(gym?.budget).toBe(81.25);
    expect(categoryAverages(records, months, budgetFor).find((r) => r.name === 'Cats')?.budget).toBeNull();
  });
});

