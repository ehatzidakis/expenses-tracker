import { describe, expect, it } from 'vitest';
import { CreateSplitState } from './split-fields.component';
import { TransactionFormModel } from './create-transaction.models';
import { buildTransactionPayload, buildTransactionUpdatePayload } from './transaction-payload';

const model: TransactionFormModel = {
  date: '2026-09-26',
  description: 'Dinner',
  category: 'Food',
  subCategoryId: null,
  subCategory: '',
  comment: '',
  amount: 15,
};

const customSplit: CreateSplitState = {
  goesSplitzes: true,
  splitWith: [2],
  paidById: 2,
  customSplitMode: true,
  customSplitAmounts: { me: 5, 2: 10 },
};

describe('buildTransactionPayload custom splits', () => {
  it('preserves a selected non-me payer while storing my custom share as amount', () => {
    const result = buildTransactionPayload(model, customSplit, {
      linked: false,
      adjustmentId: '',
    });

    expect(result).toEqual({
      ok: true,
      payload: expect.objectContaining({
        amount: 5,
        isSplit: true,
        paidBy: 2,
        splitBy: [2],
        splitType: 'custom',
        totalAmount: 15,
        customSplitAmounts: { me: 5, 2: 10 },
      }),
    });
  });

  it('rejects a custom split whose shares do not equal the full amount', () => {
    const result = buildTransactionPayload(
      model,
      { ...customSplit, customSplitAmounts: { me: 5, 2: 9 } },
      { linked: false, adjustmentId: '' },
    );

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining('Custom split total must equal €15.00'),
    });
  });
});

describe('buildTransactionUpdatePayload', () => {
  const evenSplit: CreateSplitState = {
    goesSplitzes: true,
    splitWith: [1, 2],
    paidById: 'me',
    customSplitMode: false,
    customSplitAmounts: {},
  };

  it('stores my share (with the remainder cent) and keeps the full total', () => {
    const result = buildTransactionUpdatePayload({ ...model, amount: 10 }, evenSplit);

    expect(result).toEqual({
      ok: true,
      payload: expect.objectContaining({
        amount: 3.34,
        totalAmount: 10,
        isSplit: true,
        splitBy: [1, 2],
        splitType: 'split',
      }),
    });
  });

  it('sends isSplit false when the split is turned off', () => {
    const result = buildTransactionUpdatePayload(model, { ...evenSplit, goesSplitzes: false });

    expect(result).toEqual({
      ok: true,
      payload: expect.objectContaining({ amount: 15, isSplit: false, totalAmount: 15 }),
    });
  });

  it('keeps the trip link when an adjustment id is given', () => {
    const result = buildTransactionUpdatePayload(
      model,
      { ...evenSplit, goesSplitzes: false },
      'trip-1',
    );

    expect(result.ok && result.payload.adjustmentId).toBe('trip-1');
  });

  it('rejects a custom split that does not add up', () => {
    const result = buildTransactionUpdatePayload(model, {
      ...customSplit,
      customSplitAmounts: { me: 1, 2: 1 },
    });

    expect(result.ok).toBe(false);
  });
});
