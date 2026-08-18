import { describe, expect, it } from 'vitest';
import { Transaction } from '../models/transaction.model';
import { computeSplitDebtEntries } from './splitz.service';

describe('splitz debt calculations', () => {
  it('supports “Only They Owe” transactions as zero-value payer transactions', () => {
    const tx: Transaction = {
      id: 'tx-1',
      monthName: 'August 2026',
      date: '2026-08-18',
      description: 'Dinner',
      amount: 0,
      category: 'Food',
      createdAt: '2026-08-18T00:00:00.000Z',
      isSplit: true,
      paidBy: 'me',
      splitBy: [1, 2],
      splitType: 'onlyTheyOwe',
      totalAmount: 20,
      splitPaidPersonIds: [],
    };

    expect(computeSplitDebtEntries(tx)).toEqual([
      {
        transactionId: 'tx-1',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 1,
        creditorId: 'me',
        amount: 10,
        paid: false,
      },
      {
        transactionId: 'tx-1',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 2,
        creditorId: 'me',
        amount: 10,
        paid: false,
      },
    ]);
  });

  it('infers legacy “Only They Owe” records from the stored zero-amount split shape', () => {
    const tx: Transaction = {
      id: 'tx-2',
      monthName: 'August 2026',
      date: '2026-08-18',
      description: 'Dinner',
      amount: 0,
      category: 'Food',
      createdAt: '2026-08-18T00:00:00.000Z',
      isSplit: true,
      paidBy: 'me',
      splitBy: [1, 2],
      totalAmount: 20,
      splitPaidPersonIds: [],
    };

    expect(computeSplitDebtEntries(tx)).toEqual([
      {
        transactionId: 'tx-2',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 1,
        creditorId: 'me',
        amount: 10,
        paid: false,
      },
      {
        transactionId: 'tx-2',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 2,
        creditorId: 'me',
        amount: 10,
        paid: false,
      },
    ]);
  });
});
