import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { BudgetSettingsService } from './budget-settings.service';
import { SyncMarkerService } from './sync-marker.service';
import { kioskAnswerFields, splitUpdateFields, TransactionService } from './transaction-service';

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
        { provide: SyncMarkerService, useValue: { bump: vi.fn() } },
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

describe('kioskAnswerFields', () => {
  const answer = {
    date: '2026-11-01',
    description: ' Lidl ',
    category: 'Supermarket',
    amount: 12.5,
  };

  it('turns the request into a kiosk item with the entered amount', () => {
    const { set } = kioskAnswerFields(answer, 'kiosk-uid', '2026-11-01T10:00:00.000Z');

    expect(set).toMatchObject({
      description: 'Lidl',
      amount: 12.5,
      totalAmount: 12.5,
      isSplit: false,
      splitBy: [],
      sourceRole: 'kiosk',
      requestStatus: 'answered',
      createdByUid: 'kiosk-uid',
      respondedAt: '2026-11-01T10:00:00.000Z',
    });
  });

  it('clears leftover split and trip data, and optional fields left empty', () => {
    const { set, clear } = kioskAnswerFields(answer, 'kiosk-uid', 'now');

    expect(clear).toEqual(
      expect.arrayContaining([
        'paidBy',
        'splitType',
        'customSplitAmounts',
        'adjustmentId',
        'subCategoryId',
        'subCategory',
        'comment',
      ]),
    );
    expect(set).not.toHaveProperty('comment');
  });

  it('keeps optional fields that were filled in', () => {
    const { set, clear } = kioskAnswerFields(
      { ...answer, subCategoryId: 3, subCategory: 'Weekly', comment: ' receipt in bag ' },
      'kiosk-uid',
      'now',
    );

    expect(set).toMatchObject({
      subCategoryId: 3,
      subCategory: 'Weekly',
      comment: 'receipt in bag',
    });
    expect(clear).not.toContain('comment');
  });
});
