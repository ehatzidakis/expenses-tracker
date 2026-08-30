import { Transaction } from '../../models/transaction.model';
import {
  CATEGORY_NAMES,
  getSubcategoryOptions,
  categoryRequiresSubcategory,
} from '../../services/expense-state.service';

export interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  subCategory: string;
  amount: number;
  isSplit?: boolean;
  paidBy?: 'me' | number;
  splitBy?: number[];
  splitPaidPersonIds?: number[];
  splitType?: 'split' | 'onlyMeOwes' | 'onlyTheyOwe' | 'custom';
  totalAmount?: number;
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
    CATEGORY_NAMES.includes(normalizedCategory) || !normalizedCategory
      ? normalizedCategory || CATEGORY_NAMES[0] || ''
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
    amount: tx.amount ?? 0,
    isSplit: tx.isSplit,
    paidBy: tx.paidBy,
    splitBy: tx.splitBy,
    splitPaidPersonIds: tx.splitPaidPersonIds,
    splitType: tx.splitType,
    totalAmount: tx.totalAmount,
  };
}
