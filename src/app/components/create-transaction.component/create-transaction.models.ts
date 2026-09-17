export type EntryType = 'transaction' | 'adjustment';

export interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  subCategory: string;
  comment: string;
  amount: number;
}

export interface AdjustmentFormModel {
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  isTrip?: boolean;
  isSelectable?: boolean;
}

export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function defaultTransactionModel(): TransactionFormModel {
  return {
    date: todayDateInputValue(),
    description: '',
    category: '',
    subCategoryId: null,
    subCategory: '',
    comment: '',
    amount: 0,
  };
}

export function defaultAdjustmentModel(): AdjustmentFormModel {
  return {
    description: '',
    amount: 0.0,
    startDate: todayDateInputValue(),
    endDate: todayDateInputValue(),
    isTrip: false,
    isSelectable: false,
  };
}
