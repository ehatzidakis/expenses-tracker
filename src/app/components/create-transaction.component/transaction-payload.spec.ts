import { describe, expect, it } from 'vitest';
import { CreateSplitState } from './split-fields.component';
import { TransactionFormModel } from './create-transaction.models';
import { buildTransactionPayload } from './transaction-payload';

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
