import { Transaction } from '../../models/transaction.model';
import {
  CATEGORY_NAMES,
  TRIP_CATEGORY_NAMES,
  getSubcategoryOptions,
  categoryRequiresSubcategory,
} from '../../services/expense-state.service';
import { getTransactionTotalAmount } from '../../services/transaction-service';

export interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  subCategory: string;
  comment: string;
  /** Full bill. For a split, my share is derived from it on save. */
  amount: number;
}

/** Once anyone has settled, the money on a split can no longer change. */
export function isSplitLocked(tx: Pick<Transaction, 'isSplit' | 'splitPaidPersonIds'>): boolean {
  return Boolean(tx.isSplit && tx.splitPaidPersonIds?.length);
}

export function normalizeCategoryName(category?: string | null): string {
  const trimmed = category?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const exactMatch = CATEGORY_NAMES.find((name) => name.toLowerCase() === trimmed.toLowerCase());

  return exactMatch ?? trimmed;
}

export function buildTransactionFormModel(tx: Transaction): TransactionFormModel {
  const normalizedCategory = normalizeCategoryName(tx.category);
  const category =
    normalizedCategory &&
    (CATEGORY_NAMES.includes(normalizedCategory) ||
      TRIP_CATEGORY_NAMES.includes(normalizedCategory))
      ? normalizedCategory
      : CATEGORY_NAMES[0] || '';

  const categorySubcategories = getSubcategoryOptions(category);

  const validStoredSubcategoryId =
    tx.subCategoryId != null &&
    categorySubcategories.some((option) => option.id === Number(tx.subCategoryId))
      ? Number(tx.subCategoryId)
      : null;

  const resolvedSubcategoryId =
    validStoredSubcategoryId ??
    (categoryRequiresSubcategory(category) ? (categorySubcategories[0]?.id ?? null) : null);

  const resolvedSubcategory =
    resolvedSubcategoryId != null
      ? (categorySubcategories.find((option) => option.id === resolvedSubcategoryId)?.name ??
        tx.subCategory ??
        '')
      : '';

  return {
    date: tx.date ?? '',
    description: tx.description ?? '',
    category,
    subCategoryId: resolvedSubcategoryId,
    subCategory: resolvedSubcategory,
    comment: tx.comment ?? '',
    amount: getTransactionTotalAmount(tx),
  };
}
