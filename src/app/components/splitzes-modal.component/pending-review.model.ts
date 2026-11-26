import { PEOPLE } from '../../models/splitz.model';
import {
  getPendingTransactionTotalAmount,
  NewTransactionInput,
  normalizePendingForReview,
  PendingTransaction,
} from '../../services/transaction-service';
import { TransactionFormModel } from '../create-transaction.component/create-transaction.models';
import {
  CreateSplitState,
  toSplitState,
} from '../create-transaction.component/split-fields.component';
import {
  BuildResult,
  buildTransactionUpdatePayload,
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
  return toSplitState(normalizePendingForReview(pending));
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
  return buildTransactionUpdatePayload(model, split, pending.adjustmentId);
}

export function pendingSourceLabel(pending: PendingTransaction): string {
  return pending.sourceRole === 'admin' ? 'Eftihis' : 'Kiosk';
}

/** A request the admin sent that the kiosk hasn't answered yet. */
export function isAwaitingKiosk(pending: PendingTransaction): boolean {
  return pending.requestStatus === 'awaiting-kiosk';
}

/** Items the admin has to act on: kiosk submissions and replies, and declined requests. */
export function needsAdminAttention(pending: PendingTransaction): boolean {
  return pending.sourceRole === 'kiosk' || pending.requestStatus === 'declined';
}

/** Extra label for request items, or null for ordinary pending items. */
export function pendingStatusLabel(pending: PendingTransaction): string | null {
  switch (pending.requestStatus) {
    case 'awaiting-kiosk':
      return 'Waiting for kiosk';
    case 'answered':
      return 'Kiosk reply';
    case 'declined':
      return pending.requestNote
        ? `Kiosk couldn't fill: ${pending.requestNote}`
        : "Kiosk couldn't fill";
    default:
      return null;
  }
}

export interface PendingCategoryGroup {
  /** The stored category name, or '' when it has none. */
  category: string;
  items: PendingTransaction[];
  total: number;
}

/**
 * Groups pending items by category, keeping each group's items in the order given.
 * Categories are alphabetical; items without one go last.
 */
export function groupPendingByCategory(
  items: readonly PendingTransaction[],
): PendingCategoryGroup[] {
  const groups = new Map<string, PendingCategoryGroup>();
  for (const item of items) {
    const category = item.category?.trim() ?? '';
    let group = groups.get(category);
    if (!group) {
      group = { category, items: [], total: 0 };
      groups.set(category, group);
    }
    group.items.push(item);
    group.total += getPendingTransactionTotalAmount(item);
  }

  return [...groups.values()]
    .map((group) => ({ ...group, total: Math.round(group.total * 100) / 100 }))
    .sort((a, b) => {
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.category.localeCompare(b.category);
    });
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
