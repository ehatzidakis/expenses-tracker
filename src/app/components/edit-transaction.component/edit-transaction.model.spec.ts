import { describe, expect, it } from 'vitest';
import { Transaction } from '../../models/transaction.model';
import { buildTransactionFormModel } from './edit-transaction.model';

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
