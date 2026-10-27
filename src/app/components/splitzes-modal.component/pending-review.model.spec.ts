import { describe, expect, it } from 'vitest';
import { PendingTransaction } from '../../services/transaction-service';
import { CreateSplitState } from '../create-transaction.component/split-fields.component';
import {
  buildPendingAcceptPayload,
  pendingToFormModel,
  pendingToSplitState,
} from './pending-review.model';

function pending(overrides: Partial<PendingTransaction> = {}): PendingTransaction {
  return {
    id: 'p1',
    date: '2026-09-18',
    description: 'Dinner',
    category: 'Supermarket',
    amount: 12,
    createdAt: '2026-09-18T10:00:00.000Z',
    sourceRole: 'admin',
    status: 'pending',
    ...overrides,
  };
}

const noSplit: CreateSplitState = {
  goesSplitzes: false,
  splitWith: [],
  paidById: 'me',
  customSplitMode: false,
  customSplitAmounts: {},
};

describe('pending review model', () => {
  it('uses the total amount of a split pending transaction in the form', () => {
    const model = pendingToFormModel(
      pending({ isSplit: true, amount: 6, totalAmount: 12, comment: 'note' }),
    );
    expect(model.amount).toBe(12);
    expect(model.comment).toBe('note');
    expect(model.subCategoryId).toBeNull();
  });

  it('applies the default kiosk split when reviewing kiosk entries', () => {
    const split = pendingToSplitState(pending({ sourceRole: 'kiosk', isSplit: false }));
    expect(split).toEqual({
      goesSplitzes: true,
      splitWith: [1],
      paidById: 1,
      customSplitMode: false,
      customSplitAmounts: {},
    });
  });

  it('maps a stored custom split into split state', () => {
    const split = pendingToSplitState(
      pending({
        isSplit: true,
        splitType: 'custom',
        splitBy: [2],
        paidBy: 'me',
        customSplitAmounts: { me: 5, 2: 7 },
      }),
    );
    expect(split.customSplitMode).toBe(true);
    expect(split.splitWith).toEqual([2]);
    expect(split.customSplitAmounts).toEqual({ me: 5, 2: 7 });
  });

  it('records my share for an even split', () => {
    const p = pending();
    const result = buildPendingAcceptPayload(
      { ...pendingToFormModel(p), amount: 30 },
      { ...noSplit, goesSplitzes: true, splitWith: [1] },
      p,
    );
    expect(result).toEqual({
      ok: true,
      payload: expect.objectContaining({
        amount: 15,
        totalAmount: 30,
        isSplit: true,
        splitBy: [1],
        splitType: 'split',
      }),
    });
  });

  it('records my custom share and keeps the total', () => {
    const p = pending();
    const result = buildPendingAcceptPayload(
      pendingToFormModel(p),
      {
        ...noSplit,
        goesSplitzes: true,
        splitWith: [1],
        customSplitMode: true,
        customSplitAmounts: { me: 8, 1: 4 },
      },
      p,
    );
    expect(result).toEqual({
      ok: true,
      payload: expect.objectContaining({
        amount: 8,
        totalAmount: 12,
        splitType: 'custom',
        customSplitAmounts: { me: 8, 1: 4 },
      }),
    });
  });

  it('rejects a custom split whose shares do not add up', () => {
    const p = pending();
    const result = buildPendingAcceptPayload(
      pendingToFormModel(p),
      {
        ...noSplit,
        goesSplitzes: true,
        splitWith: [1],
        customSplitMode: true,
        customSplitAmounts: { me: 5, 1: 3 },
      },
      p,
    );
    expect(result).toEqual({
      ok: false,
      error: 'Custom split total must equal €12.00. €4.00 remaining to be split',
    });
  });

  it('sends isSplit false when the split is turned off', () => {
    const p = pending({ isSplit: true, splitBy: [1], paidBy: 'me', totalAmount: 12 });
    const result = buildPendingAcceptPayload(pendingToFormModel(p), noSplit, p);
    expect(result).toEqual({
      ok: true,
      payload: expect.objectContaining({
        amount: 12,
        isSplit: false,
        splitBy: [],
        totalAmount: 12,
      }),
    });
  });

  it('keeps the trip link', () => {
    const p = pending({ adjustmentId: 'trip-1', category: 'Food' });
    const result = buildPendingAcceptPayload(pendingToFormModel(p), noSplit, p);
    expect(result.ok && result.payload.adjustmentId).toBe('trip-1');
  });
});
