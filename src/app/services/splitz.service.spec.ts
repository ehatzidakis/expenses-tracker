import { describe, expect, it } from 'vitest';
import { Transaction } from '../models/transaction.model';
import { computeSplitDebtEntries, selectDebtsToSettle } from './splitz.service';
import {
  normalizePendingSplitOverride,
  resolvePendingCategoryOptions,
  comparePendingTransactionsByDate,
  normalizePendingForReview,
  type PendingTransaction,
} from './transaction-service';

describe('splitz debt calculations', () => {
  it('selects only the confirmed settlement direction', () => {
    const debts = [
      {
        transactionId: 'tx-direction',
        description: 'Dinner',
        date: '2026-09-18',
        debtorId: 1,
        creditorId: 'me' as const,
        amount: 10,
        paid: false,
      },
      {
        transactionId: 'tx-direction',
        description: 'Dinner',
        date: '2026-09-18',
        debtorId: 'me' as const,
        creditorId: 1,
        amount: 5,
        paid: false,
      },
    ];

    expect(selectDebtsToSettle(debts, 1, 'person-pays-me')).toEqual([debts[0]]);
    expect(selectDebtsToSettle(debts, 1, 'i-pay-person')).toEqual([debts[1]]);
  });

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

  it('sorts pending reviews by transaction date instead of createdAt', () => {
    const pending = [
      { id: 'created-first', date: '2026-10-25', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'created-second', date: '2026-10-01', createdAt: '2026-09-03T00:00:00.000Z' },
      { id: 'created-third', date: '2026-10-04', createdAt: '2026-09-02T00:00:00.000Z' },
    ];

    expect([...pending].sort(comparePendingTransactionsByDate).map((entry) => entry.id)).toEqual([
      'created-second',
      'created-third',
      'created-first',
    ]);
  });

  it('keeps a valid pending subcategory ID unchanged during review normalization', () => {
    const pending: PendingTransaction = {
      id: 'pending-subcategory',
      createdAt: '2026-09-18T00:00:00.000Z',
      sourceRole: 'admin',
      status: 'pending',
      date: '2026-09-18',
      description: 'Cinema night',
      category: 'Tickets',
      subCategoryId: 2,
      subCategory: 'movies',
      amount: 25,
    };

    expect(normalizePendingForReview(pending)).toMatchObject({
      subCategoryId: 2,
      subCategory: 'movies',
    });
  });
});
