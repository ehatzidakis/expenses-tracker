export interface Transaction {
  id: string;
  monthName: string;
  date: string;
  description: string;
  /** My share of the expense (equals totalAmount when not a split). */
  amount: number;
  category: string;
  subCategoryId?: number;
  subCategory?: string;
  createdAt: string;
  adjustmentId?: string;
  // Split fields — only present when isSplit is true
  isSplit?: boolean;
  /** Who paid the full bill: 'me' or a person ID from PEOPLE. */
  paidBy?: 'me' | number;
  /** Person IDs (from PEOPLE) this was split with, excluding 'me'. */
  splitBy?: number[];
  /** Split mode used to derive the debt entries. */
  splitType?: 'split' | 'onlyMeOwes' | 'onlyTheyOwe' | 'custom';
  /** Original full amount before the split. */
  totalAmount?: number;
  /** Exact amounts for each participant when using a custom split. Keys are 'me' or person IDs. */
  customSplitAmounts?: Partial<Record<'me' | number, number>>;
  /** Debtors who have already settled their share. 0 = 'me', 1/2/3 = person IDs. */
  splitPaidPersonIds?: number[];
}
