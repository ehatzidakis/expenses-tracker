import { PEOPLE } from '../../models/splitz.model';
import {
  getPendingTransactionTotalAmount,
  NewTransactionInput,
  normalizePendingForReview,
  PendingTransaction,
} from '../../services/transaction-service';
import { TransactionFormModel } from '../create-transaction.component/create-transaction.models';
import { CreateSplitState } from '../create-transaction.component/split-fields.component';
import {
  BuildResult,
  buildTransactionPayload,
} from '../create-transaction.component/transaction-payload';

export function pendingToFormModel(pending: PendingTransaction): TransactionFormModel {
  const normalized = normalizePendingForReview(pending);
  return {
    date: normalized.date,
    description: normalized.description ?? '',
    category: normalized.category ?? '',
    subCategoryId: normalized.subCategoryId != null ? Number(normalized.subCategoryId) : null,
    subCategory: normalized.subCategory ?? '',
    comment: normalized.comment ?? '',
    amount: getPendingTransactionTotalAmount(normalized),
  };
}

export function pendingToSplitState(pending: PendingTransaction): CreateSplitState {
  const normalized = normalizePendingForReview(pending);
  const isSplit = Boolean(normalized.isSplit);
  return {
    goesSplitzes: isSplit,
    splitWith: isSplit ? [...(normalized.splitBy ?? [])] : [],
    paidById: isSplit ? (normalized.paidBy ?? 'me') : 'me',
    customSplitMode: isSplit && normalized.splitType === 'custom',
    customSplitAmounts: { ...(normalized.customSplitAmounts ?? {}) },
  };
}

/**
 * Builds the overrides sent when accepting a pending transaction.
 * The service merges these over the stored pending doc, so a split that was
 * turned off must be sent as `isSplit: false` explicitly.
 */
export function buildPendingAcceptPayload(
  model: TransactionFormModel,
  split: CreateSplitState,
  pending: PendingTransaction,
): BuildResult<NewTransactionInput> {
  const result = buildTransactionPayload(model, split, {
    linked: Boolean(pending.adjustmentId),
    adjustmentId: pending.adjustmentId ?? '',
  });
  if (!result.ok) return result;

  if (result.payload.isSplit) return result;

  return {
    ok: true,
    payload: { ...result.payload, isSplit: false, splitBy: [], totalAmount: model.amount },
  };
}

export function pendingSourceLabel(pending: PendingTransaction): string {
  return pending.sourceRole === 'admin' ? 'Eftihis' : 'Kiosk';
}

export function participantName(id: 'me' | number | undefined): string {
  if (id === 'me') return 'Me';
  if (id === undefined) return 'Unknown';
  return PEOPLE.find((person) => person.id === id)?.name ?? `Person ${id}`;
}

export function formatPendingDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (![year, month, day].every(Number.isInteger)) {
    return date;
  }

  const localDate = new Date(year, month - 1, day);
  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return date;
  }

  return localDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
