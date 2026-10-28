import { describe, expect, it } from 'vitest';
import { Transaction } from '../../models/transaction.model';
import { buildTransactionFormModel, isSplitLocked } from './edit-transaction.model';

describe('buildTransactionFormModel', () => {
  it('preserves trip categories that are not in the standard budget list', () => {
    const tx: Transaction = {
      id: 'tx-trip-1',
      monthName: 'August 2026',
      date: '2026-08-18',
      description: 'Trip dinner',
      amount: 42,
      category: 'Food',
      createdAt: '2026-08-18T00:00:00.000Z',
    };

    expect(buildTransactionFormModel(tx).category).toBe('Food');
  });
});

describe('split editing helpers', () => {
  const split: Transaction = {
    id: 'tx-split-1',
    monthName: 'October 2026',
    date: '2026-10-01',
    description: 'Dinner',
    amount: 3.34,
    category: 'Supermarket',
    createdAt: '2026-10-01T00:00:00.000Z',
    isSplit: true,
    paidBy: 'me',
    splitBy: [1, 2],
    splitType: 'split',
    totalAmount: 10,
    splitPaidPersonIds: [],
  };

  it('edits the full bill for a split, not my share', () => {
    expect(buildTransactionFormModel(split).amount).toBe(10);
  });

  it('locks the money only once someone has settled', () => {
    expect(isSplitLocked(split)).toBe(false);
    expect(isSplitLocked({ ...split, splitPaidPersonIds: [1] })).toBe(true);
    expect(isSplitLocked({ ...split, isSplit: false, splitPaidPersonIds: [1] })).toBe(false);
  });
});
