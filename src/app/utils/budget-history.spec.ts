import { describe, expect, it } from 'vitest';
import {
  BudgetPeriod,
  categoryHistory,
  formatMonthKey,
  monthKey,
  monthKeyOf,
  periodFor,
  periodSummaries,
  withSavedPeriod,
} from './budget-history';
import { BUDGET_HISTORY_FIXTURE as H } from './budget-history.testing';

const latest = H[H.length - 1];
const saved = (from: string, changes: Record<string, number>, wage = latest.wage): BudgetPeriod => ({
  from,
  wage,
  categoryBudgets: { ...latest.categoryBudgets, ...changes },
});

describe('month keys', () => {
  it('turns a month name into a sortable key', () => {
    expect(monthKey('March 2025')).toBe('2025-03');
    expect(monthKey('November 2026')).toBe('2026-11');
  });

  it('returns null for a name it cannot read', () => {
    expect(monthKey('nonsense')).toBeNull();
    expect(monthKey('All Time')).toBeNull();
  });

  it('formats a key as a short month and year', () => {
    expect(formatMonthKey('2026-03')).toBe('Mar 2026');
  });

  it('gives the local month of a date', () => {
    expect(monthKeyOf(new Date(2026, 10, 28))).toBe('2026-11');
    expect(monthKeyOf(new Date(2026, 0, 1))).toBe('2026-01');
  });
});

describe('periodFor', () => {
  const gym = (key?: string | null) => periodFor(H, key)!.categoryBudgets['Gym'];

  it('uses the period a month falls in, including its first and last month', () => {
    expect(gym('2026-02')).toBe(100);
    expect(gym('2026-03')).toBe(62.5);
    expect(gym('2026-07')).toBe(62.5);
    expect(gym('2026-08')).toBe(65);
  });

  it('uses the first period for a month before the history starts', () => {
    expect(gym('2024-01')).toBe(100);
  });

  it('uses the latest period when no month is given', () => {
    expect(gym(null)).toBe(65);
    expect(gym(undefined)).toBe(65);
  });

  it('returns null without any history', () => {
    expect(periodFor([], '2026-01')).toBeNull();
  });
});

describe('withSavedPeriod', () => {
  it('adds a period starting this month when a budget changes', () => {
    const next = withSavedPeriod(H, saved('2026-11', { Gym: 70 }));
    expect(next).toHaveLength(4);
    expect(next[3].from).toBe('2026-11');
    expect(next[3].categoryBudgets['Gym']).toBe(70);
  });

  it('replaces this month’s period when saving twice in a month', () => {
    const once = withSavedPeriod(H, saved('2026-11', { Gym: 70 }));
    const twice = withSavedPeriod(once, saved('2026-11', { Gym: 75 }));
    expect(twice).toHaveLength(4);
    expect(twice[3].categoryBudgets['Gym']).toBe(75);
  });

  it('leaves no period behind when a change is reverted in the same month', () => {
    const once = withSavedPeriod(H, saved('2026-11', { Gym: 70 }));
    const reverted = withSavedPeriod(once, saved('2026-11', { Gym: 65 }));
    expect(reverted).toEqual(H);
  });

  it('adds nothing when nothing changed', () => {
    expect(withSavedPeriod(H, saved('2026-11', {}))).toEqual(H);
  });

  it('ignores float noise below a cent', () => {
    const next = withSavedPeriod(
      H.slice(0, 2),
      { ...H[1], from: '2026-11', categoryBudgets: { ...H[1].categoryBudgets, Gym: 62.50000000001 } },
    );
    expect(next).toEqual(H.slice(0, 2));
  });

  it('adds a period when only the wage changed', () => {
    expect(withSavedPeriod(H, saved('2026-11', {}, 1700))).toHaveLength(4);
  });

  it('starts a history from nothing', () => {
    expect(withSavedPeriod([], saved('2026-11', {}))).toEqual([saved('2026-11', {})]);
  });
});

describe('categoryHistory', () => {
  it('lists each change newest first with the months it covered', () => {
    expect(categoryHistory(H, 'Gym')).toEqual([
      { amount: 65, from: '2026-08', to: null },
      { amount: 62.5, from: '2026-03', to: '2026-07' },
      { amount: 100, from: '2025-03', to: '2026-02' },
    ]);
  });

  it('merges periods where the category kept its amount', () => {
    expect(categoryHistory(H, 'Supermarket')).toEqual([{ amount: 280, from: '2025-03', to: null }]);
    expect(categoryHistory(H, 'EatingOut')).toEqual([
      { amount: 130, from: '2026-08', to: null },
      { amount: 140, from: '2025-03', to: '2026-07' },
    ]);
  });
});

describe('periodSummaries', () => {
  it('sums each period and what it left to save, newest first', () => {
    const rows = periodSummaries(H);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ from: '2026-08', to: null, wage: 1600, budgeted: 1330, left: 270 });
    expect(rows[1]).toEqual({ from: '2026-03', to: '2026-07', wage: 1540, budgeted: 1317.5, left: 222.5 });
    expect(rows[2]).toEqual({ from: '2025-03', to: '2026-02', wage: 1400, budgeted: 1300, left: 100 });
  });
});
