import { describe, expect, it } from 'vitest';
import { Transaction } from '../models/transaction.model';
import { computeSplitDebtEntries } from './splitz.service';
import {
  normalizePendingSplitOverride,
  resolvePendingCategoryOptions,
  type PendingTransaction,
} from './transaction-service';

describe('splitz debt calculations', () => {
  it('supports standard split transactions', () => {
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
      splitType: 'split',
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
        amount: 6.66,
        paid: false,
      },
      {
        transactionId: 'tx-1',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 2,
        creditorId: 'me',
        amount: 6.66,
        paid: false,
      },
    ]);
  });

  it('supports custom per-person split amounts and respects the exact total', () => {
    const tx: Transaction = {
      id: 'tx-custom',
      monthName: 'August 2026',
      date: '2026-08-18',
      description: 'Dinner',
      amount: 12.9,
      category: 'Food',
      createdAt: '2026-08-18T00:00:00.000Z',
      isSplit: true,
      paidBy: 'me',
      splitBy: [1, 2],
      splitType: 'custom',
      totalAmount: 24.9,
      customSplitAmounts: {
        me: 12.9,
        1: 8,
        2: 4,
      },
      splitPaidPersonIds: [],
    };

    expect(computeSplitDebtEntries(tx)).toEqual([
      {
        transactionId: 'tx-custom',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 1,
        creditorId: 'me',
        amount: 8,
        paid: false,
      },
      {
        transactionId: 'tx-custom',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 2,
        creditorId: 'me',
        amount: 4,
        paid: false,
      },
    ]);
  });

  it('makes me owe the selected payer only my custom share', () => {
    const tx: Transaction = {
      id: 'tx-custom-paid-by-person',
      monthName: 'September 2026',
      date: '2026-09-26',
      description: 'Dinner',
      amount: 5,
      category: 'Food',
      createdAt: '2026-09-26T00:00:00.000Z',
      isSplit: true,
      paidBy: 2,
      splitBy: [2],
      splitType: 'custom',
      totalAmount: 15,
      customSplitAmounts: { me: 5, 2: 10 },
      splitPaidPersonIds: [],
    };

    expect(computeSplitDebtEntries(tx)).toEqual([
      {
        transactionId: 'tx-custom-paid-by-person',
        description: 'Dinner',
        date: '2026-09-26',
        debtorId: 'me',
        creditorId: 2,
        amount: 5,
        paid: false,
      },
    ]);
  });

  it('keeps even splits on the standard split path', () => {
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
      splitType: 'split',
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
        amount: 6.66,
        paid: false,
      },
      {
        transactionId: 'tx-2',
        description: 'Dinner',
        date: '2026-08-18',
        debtorId: 2,
        creditorId: 'me',
        amount: 6.66,
        paid: false,
      },
    ]);
  });

  it('overrides incoming pending split data to Stavi defaults', () => {
    const pending: PendingTransaction = {
      id: 'pending-1',
      createdAt: '2026-08-18T00:00:00.000Z',
      sourceRole: 'kiosk',
      status: 'pending',
      date: '2026-08-18',
      description: 'Incoming data',
      category: 'Food',
      amount: 12.5,
      isSplit: false,
      paidBy: 2,
      splitBy: [2, 3],
      splitType: 'custom',
      totalAmount: 12.5,
      customSplitAmounts: { me: 3, 2: 5, 3: 4.5 },
    };

    expect(normalizePendingSplitOverride(pending)).toMatchObject({
      isSplit: true,
      paidBy: 1,
      splitBy: [1],
      splitType: 'split',
    });
  });

  it('uses the right category set for normal and linked pending transactions', () => {
    expect(resolvePendingCategoryOptions({ category: 'Food' })).toContain('Food');
    expect(resolvePendingCategoryOptions({ category: 'Food', adjustmentId: 'trip-1' })).toContain(
      'Food',
    );
    expect(
      resolvePendingCategoryOptions({ category: 'Accommodation', adjustmentId: 'trip-1' }),
    ).toContain('Accommodation');
  });
});
