import { describe, expect, it } from 'vitest';
import type { CategorySpend } from '../services/expense-state.service';
import { isCategorySort, sortCategories } from './category-sort';

// Synthetic categories only.
const row = (name: string, amount: number, budget: number | null, extra: Partial<CategorySpend> = {}): CategorySpend => ({
  name,
  amount,
  budget,
  monthlyAverage: null,
  isAllTime: false,
  percentage: 0,
  overallBudget: null,
  isOverBudget: budget !== null && amount > budget,
  ...extra,
});

const MONTH = [
  row('Gym', 62.5, 65),
  row('Subscriptions', 20, 15), // 133% used, €5 over
  row('Supermarket', 300, 280), // 107% used, €20 over
  row('Personal', 50, 200), // 25% used, €150 left
  row('Medical', 0, 180),
  row('Mystery', 40, null), // no budget
];

const names = (rows: CategorySpend[]) => rows.map((r) => r.name);

describe('sortCategories', () => {
  it('keeps the fixed default order, with unknown categories last', () => {
    expect(names(sortCategories(MONTH, 'default'))).toEqual([
      'Supermarket',
      'Personal',
      'Medical',
      'Subscriptions',
      'Gym',
      'Mystery',
    ]);
  });

  it('sorts by spend both ways', () => {
    expect(names(sortCategories(MONTH, 'spent-desc'))).toEqual([
      'Supermarket',
      'Gym',
      'Personal',
      'Mystery',
      'Subscriptions',
      'Medical',
    ]);
    expect(names(sortCategories(MONTH, 'spent-asc'))[0]).toBe('Medical');
  });

  it('sorts by euros left, unbudgeted last either way', () => {
    expect(names(sortCategories(MONTH, 'left-desc'))).toEqual([
      'Medical',
      'Personal',
      'Gym',
      'Subscriptions',
      'Supermarket',
      'Mystery',
    ]);
    expect(names(sortCategories(MONTH, 'left-asc'))).toEqual([
      'Supermarket',
      'Subscriptions',
      'Gym',
      'Personal',
      'Medical',
      'Mystery',
    ]);
  });

  it('sorts over budget by share of the budget used, not euros', () => {
    expect(names(sortCategories(MONTH, 'over-desc')).slice(0, 2)).toEqual(['Subscriptions', 'Supermarket']);
    expect(names(sortCategories(MONTH, 'over-asc'))).toEqual([
      'Medical',
      'Personal',
      'Gym',
      'Supermarket',
      'Subscriptions',
      'Mystery',
    ]);
  });

  it('measures all time by the monthly average against the monthly budget', () => {
    const allTime = [
      row('Supermarket', 5000, 280, { isAllTime: true, monthlyAverage: 250 }),
      row('Gym', 1500, 65, { isAllTime: true, monthlyAverage: 75 }),
    ];
    expect(names(sortCategories(allTime, 'over-desc'))).toEqual(['Gym', 'Supermarket']);
    expect(names(sortCategories(allTime, 'spent-desc'))).toEqual(['Supermarket', 'Gym']);
  });

  it('recognises stored values', () => {
    expect(isCategorySort('left-asc')).toBe(true);
    expect(isCategorySort('sideways')).toBe(false);
  });
});
