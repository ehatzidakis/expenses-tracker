import { categoryRequiresSubcategory } from '../../services/expense-state.service';
import { computeSplit } from '../../services/splitz.service';
import { NewTransactionInput } from '../../services/transaction-service';
import { NewAdjustmentInput } from '../../services/adjustment-service';
import { CreateSplitState } from './split-fields.component';
import { AdjustmentFormModel, TransactionFormModel } from './create-transaction.models';

export type BuildResult<T> = { ok: true; payload: T } | { ok: false; error: string };

export interface AdjustmentLink {
  linked: boolean;
  adjustmentId: string;
}

// ── Custom split math ────────────────────────────────────────────────────────

export function customSplitParticipants(state: CreateSplitState): Array<'me' | number> {
  return ['me', ...state.splitWith];
}

export function customSplitTotal(state: CreateSplitState): number {
  const amounts = state.customSplitAmounts;
  return customSplitParticipants(state).reduce<number>(
    (sum, participant) => sum + Number(amounts[participant] ?? 0),
    0,
  );
}

export function customSplitRemaining(amount: number, state: CreateSplitState): number {
  return Math.round((amount - customSplitTotal(state)) * 100) / 100;
}

export function customSplitValid(amount: number, state: CreateSplitState): boolean {
  return Math.abs(customSplitRemaining(amount, state)) < 0.005;
}

export function customSplitRemainingLabel(amount: number, state: CreateSplitState): string {
  const remaining = customSplitRemaining(amount, state);
  if (Math.abs(remaining) < 0.005) {
    return 'All split — €0.00';
  }
  if (remaining > 0) {
    return `€${remaining.toFixed(2)} remaining to be split`;
  }
  return `€${Math.abs(remaining).toFixed(2)} over the total`;
}

// ── Payload builders ─────────────────────────────────────────────────────────

export function buildTransactionPayload(
  model: TransactionFormModel,
  split: CreateSplitState,
  link: AdjustmentLink,
): BuildResult<NewTransactionInput> {
  let finalAmount = model.amount;
  const customAmounts: Partial<Record<'me' | number, number>> = split.customSplitMode
    ? split.customSplitAmounts
    : {};

  if (split.goesSplitzes) {
    if (split.customSplitMode) {
      if (!customSplitValid(model.amount, split)) {
        return {
          ok: false,
          error: `Custom split total must equal €${model.amount.toFixed(2)}. ${customSplitRemainingLabel(model.amount, split)}`,
        };
      }
      finalAmount = customAmounts['me'] ?? 0;
    } else if (split.splitWith.length > 0) {
      const { myShare } = computeSplit(model.amount, split.paidById, split.splitWith);
      finalAmount = myShare;
    }
  }

  const isSplitActive = split.goesSplitzes && (split.splitWith.length > 0 || split.customSplitMode);
  const splitType: 'split' | 'custom' = split.customSplitMode ? 'custom' : 'split';

  if (categoryRequiresSubcategory(model.category) && !model.subCategoryId) {
    return { ok: false, error: 'Please select a subcategory for this ticket transaction.' };
  }

  if (split.customSplitMode && !customSplitValid(model.amount, split)) {
    return {
      ok: false,
      error: `Custom split total must equal €${model.amount.toFixed(2)}. ${customSplitRemainingLabel(model.amount, split)}`,
    };
  }

  const payload: NewTransactionInput = {
    date: model.date,
    description: model.description.trim(),
    category: model.category,
    subCategoryId: model.subCategoryId ?? undefined,
    subCategory: model.subCategory,
    comment: model.comment.trim() || undefined,
    amount: finalAmount,
    adjustmentId: link.linked ? link.adjustmentId : undefined,
    ...(isSplitActive
      ? {
          isSplit: true,
          paidBy: split.paidById,
          splitBy: split.splitWith,
          splitType,
          totalAmount: model.amount,
          ...(split.customSplitMode ? { customSplitAmounts: customAmounts } : {}),
        }
      : {}),
  };

  return { ok: true, payload };
}

export function buildKioskPayload(
  model: TransactionFormModel,
  link: AdjustmentLink,
): BuildResult<NewTransactionInput> {
  if (categoryRequiresSubcategory(model.category) && !model.subCategoryId) {
    return { ok: false, error: 'Please select a subcategory for this ticket transaction.' };
  }

  const payload: NewTransactionInput = {
    date: model.date,
    description: model.description.trim(),
    category: model.category,
    subCategoryId: model.subCategoryId ?? undefined,
    subCategory: model.subCategory,
    comment: model.comment.trim() || undefined,
    amount: model.amount,
    adjustmentId: link.linked ? link.adjustmentId : undefined,
    isSplit: false,
    splitBy: [],
    totalAmount: model.amount,
  };

  return { ok: true, payload };
}

export function buildAdjustmentPayload(
  model: AdjustmentFormModel,
  split: CreateSplitState,
  isAddition: boolean,
): BuildResult<NewAdjustmentInput> {
  let finalAmount = model.isTrip ? 0.0 : model.amount;

  if (split.goesSplitzes && split.splitWith.length > 0 && !model.isTrip) {
    const { myShare } = computeSplit(model.amount, split.paidById, split.splitWith);
    finalAmount = myShare;
  }

  const payload: NewAdjustmentInput = {
    description: model.description.trim(),
    amount: finalAmount,
    startDate: model.startDate,
    endDate: model.endDate,
    isAddition: model.isTrip ? false : isAddition,
    isTrip: model.isTrip,
    isSelectable: model.isSelectable,
  };

  return { ok: true, payload };
}
