import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { BudgetSettingsService } from './budget-settings.service';
import { splitUpdateFields, TransactionService } from './transaction-service';

type CommitInternals = { commitPendingTransaction: (id: string) => Promise<void> };

describe('TransactionService.acceptPendingTransaction', () => {
  let service: TransactionService;

  const spyOnCommit = () =>
    vi.spyOn(service as unknown as CommitInternals, 'commitPendingTransaction');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        { provide: AuthService, useValue: {} },
        { provide: BudgetSettingsService, useValue: {} },
      ],
    });
    service = TestBed.inject(TransactionService);
  });

  it('runs once when the same pending transaction is accepted concurrently', async () => {
    let finish!: () => void;
    const commit = spyOnCommit().mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );

    const first = service.acceptPendingTransaction('p1');
    const second = service.acceptPendingTransaction('p1');
    finish();
    await Promise.all([first, second]);

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('does not block a different pending transaction', async () => {
    let finish!: () => void;
    const commit = spyOnCommit()
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue(undefined);

    const first = service.acceptPendingTransaction('p1');
    await service.acceptPendingTransaction('p2');
    finish();
    await first;

    expect(commit).toHaveBeenCalledTimes(2);
  });

  it('accepts the same id again once the previous attempt has finished', async () => {
    const commit = spyOnCommit().mockResolvedValue(undefined);

    await service.acceptPendingTransaction('p1');
    await service.acceptPendingTransaction('p1');

    expect(commit).toHaveBeenCalledTimes(2);
  });

  it('releases the id when the attempt fails', async () => {
    const commit = spyOnCommit()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);

    await expect(service.acceptPendingTransaction('p1')).rejects.toThrow('offline');
    await service.acceptPendingTransaction('p1');

    expect(commit).toHaveBeenCalledTimes(2);
  });
});

describe('splitUpdateFields', () => {
  const base = { date: '2026-10-01', description: 'Dinner', category: 'Food', amount: 3.34 };

  it('writes the total that was sent instead of share × people', () => {
    const { set, clear } = splitUpdateFields(
      { isSplit: true, splitPaidPersonIds: [] },
      {
        ...base,
        isSplit: true,
        paidBy: 'me',
        splitBy: [1, 2],
        splitType: 'split',
        totalAmount: 10,
      },
    );

    expect(set).toEqual({
      isSplit: true,
      paidBy: 'me',
      splitBy: [1, 2],
      splitType: 'split',
      totalAmount: 10,
    });
    expect(clear).toEqual(['customSplitAmounts']);
  });

  it('stores custom amounts for a custom split', () => {
    const { set, clear } = splitUpdateFields(
      { isSplit: true },
      {
        ...base,
        amount: 5,
        isSplit: true,
        paidBy: 1,
        splitBy: [1],
        splitType: 'custom',
        totalAmount: 20,
        customSplitAmounts: { me: 5, 1: 15 },
      },
    );

    expect(set['customSplitAmounts']).toEqual({ me: 5, 1: 15 });
    expect(set['totalAmount']).toBe(20);
    expect(clear).toEqual([]);
  });

  it('starts settlement tracking when a plain transaction becomes a split', () => {
    const { set } = splitUpdateFields(
      { isSplit: false },
      { ...base, isSplit: true, splitBy: [1], totalAmount: 6.68 },
    );

    expect(set['splitPaidPersonIds']).toEqual([]);
  });

  it('clears all split fields when the split is turned off', () => {
    const { set, clear } = splitUpdateFields({ isSplit: true }, { ...base, isSplit: false });

    expect(set).toEqual({ isSplit: false });
    expect(clear).toEqual(
      expect.arrayContaining(['paidBy', 'splitBy', 'totalAmount', 'splitPaidPersonIds']),
    );
  });

  it('leaves split data alone when isSplit is not sent (locked split)', () => {
    expect(splitUpdateFields({ isSplit: true, splitPaidPersonIds: [1] }, base)).toEqual({
      set: {},
      clear: [],
    });
  });
});
