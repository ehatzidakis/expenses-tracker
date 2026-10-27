export type ExportFormat = 'csv' | 'json';

export type ExportScope = 'monthly' | 'transactions' | 'adjustments' | 'backup';

export interface ExportTransaction {
  id: string;
  date: string;
  monthName: string;
  description: string;
  category: string;
  subCategory?: string;
  amount: number;
  comment?: string;
  createdAt: string;
  adjustmentId?: string;
  isSplit?: boolean;
  paidBy?: 'me' | number;
  splitBy?: number[];
  splitType?: 'split' | 'custom';
  totalAmount?: number;
  customSplitAmounts?: Partial<Record<'me' | number, number>>;
  splitPaidPersonIds?: number[];
}

export interface ExportAdjustment {
  id: string;
  title: string;
  isAddition: boolean;
  amount: number;
  startDate: string;
  endDate: string;
  isTrip: boolean;
  isSelectable: boolean;
}

export interface ExportExpenseSummary {
  monthName: string;
  totalWage: number;
  categories: Record<string, number>;
}

export interface MonthlyReport {
  schemaVersion: 1;
  generatedAt: string;
  currency: 'EUR';
  monthName: string;
  totalWage: number;
  totalSpend: number;
  totalSaved: number;
  categories: Array<{
    name: string;
    budget: number | null;
    actual: number;
    variance: number | null;
    transactionCount: number;
  }>;
  adjustments: ExportAdjustment[];
  transactions: ExportTransaction[];
}

export interface FullExportBackup {
  schemaVersion: 1;
  generatedAt: string;
  currency: 'EUR';
  transactions: ExportTransaction[];
  adjustments: ExportAdjustment[];
  expenses: ExportExpenseSummary[];
}
