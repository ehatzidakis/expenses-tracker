export interface Transaction {
  id: string;
  monthName: string;
  date: string;
  description: string;
  /** My share of the expense (equals totalAmount when not a split). */
  amount: number;
  category: string;
  createdAt: string;
  adjustmentId?: string;
  // Split fields — only present when isSplit is true
  isSplit?: boolean;
  /** Who paid the full bill: 'me' or a person ID from PEOPLE. */
  paidBy?: 'me' | number;
  /** Person IDs (from PEOPLE) this was split with, excluding 'me'. */
  splitBy?: number[];
  /** Original full amount before the split. */
  totalAmount?: number;
  /** Debtors who have already settled their share. 0 = 'me', 1/2/3 = person IDs. */
  splitPaidPersonIds?: number[];
}
