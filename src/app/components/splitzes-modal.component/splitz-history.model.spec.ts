import { describe, expect, it } from 'vitest';
import { SplitzSettlementRecord } from '../../models/splitz.model';
import { Transaction } from '../../models/transaction.model';
import { groupSettlements } from './splitz-history.model';

function record(overrides: Partial<SplitzSettlementRecord>): SplitzSettlementRecord {
  return {
    id: 'r',
    recordType: 'settlement',
    transactionId: 'tx',
    description: 'Dinner',
    date: '2026-10-01',
    debtorId: 2,
    creditorId: 'me',
    amount: 10,
    createdAt: '2026-11-01T10:00:00.000Z',
    settledAt: '2026-11-01T10:00:00.000Z',
    createdByUid: 'uid',
    ...overrides,
  };
}

const settleA = '2026-11-01T10:00:00.000Z';
const settleB = '2026-11-20T18:30:00.000Z';

describe('groupSettlements', () => {
  it('groups the records of one settle-up and nets both directions', () => {
    const groups = groupSettlements([
      record({
        id: '1',
        transactionId: 't1',
        date: '2026-09-03',
        description: 'Groceries',
        amount: 40,
        createdAt: settleA,
        settledAt: settleA,
      }),
      record({
        id: '2',
        transactionId: 't2',
        date: '2026-10-20',
        description: 'Taxi',
        debtorId: 'me',
        creditorId: 2,
        amount: 14.8,
        createdAt: settleA,
        settledAt: settleA,
      }),
      record({
        id: '3',
        transactionId: 't3',
        date: '2026-09-15',
        description: 'Cinema',
        amount: 20,
        createdAt: settleA,
        settledAt: settleA,
        note: 'Bank transfer',
      }),
    ]);

    expect(groups).toHaveLength(1);
    const [group] = groups;
    expect(group.counterpartId).toBe(2);
    expect(group.owedToMe).toBe(60);
    expect(group.iOwed).toBe(14.8);
    expect(group.net).toBe(45.2);
    expect(group.note).toBe('Bank transfer');
    expect(group.rows.map((row) => row.id)).toEqual(['2', '3', '1']);
    expect(group.first?.description).toBe('Groceries');
    expect(group.last?.description).toBe('Taxi');
  });

  it('keeps separate settle-ups apart, newest first', () => {
    const groups = groupSettlements([
      record({ id: '1', createdAt: settleA, settledAt: settleA }),
      record({
        id: '2',
        createdAt: settleB,
        settledAt: settleB,
        debtorId: 'me',
        creditorId: 1,
        amount: 5,
      }),
      record({ id: '3', createdAt: settleB, settledAt: settleB, debtorId: 2 }),
    ]);

    expect(groups.map((group) => [group.settledAt, group.counterpartId])).toEqual([
      [settleB, 1],
      [settleB, 2],
      [settleA, 2],
    ]);
    expect(groups[0].net).toBe(-5);
  });

  it('adds category and full amount from the transaction when it still exists', () => {
    const tx = { id: 'tx', category: 'EatingOut', totalAmount: 30 } as Transaction;
    const [group] = groupSettlements(
      [record({ id: '1' }), record({ id: '2', transactionId: 'gone' })],
      [tx],
    );

    const byId = Object.fromEntries(group.rows.map((row) => [row.id, row]));
    expect(byId['1'].category).toBe('EatingOut');
    expect(byId['1'].transactionTotalAmount).toBe(30);
    expect(byId['2'].category).toBeUndefined();
  });

  it('falls back to createdAt and copes with undated records', () => {
    const [group] = groupSettlements([record({ settledAt: undefined, date: undefined })]);
    expect(group.settledAt).toBe(settleA);
    expect(group.first).toBeUndefined();
    expect(group.last).toBeUndefined();
  });
});
