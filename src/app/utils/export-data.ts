import {
  ExportAdjustment,
  ExportExpenseSummary,
  ExportTransaction,
  FullExportBackup,
  MonthlyReport,
} from '../models/export.model';

export const EXPORT_SCHEMA_VERSION = 1 as const;

export const TRANSACTION_COLUMNS = [
  'id',
  'date',
  'monthName',
  'description',
  'category',
  'subCategory',
  'amount',
  'comment',
  'createdAt',
  'adjustmentId',
  'isSplit',
  'paidBy',
  'splitBy',
  'splitType',
  'totalAmount',
  'customSplitAmounts',
  'splitPaidPersonIds',
] as const;

export const ADJUSTMENT_COLUMNS = [
  'id',
  'title',
  'isAddition',
  'amount',
  'startDate',
  'endDate',
  'isTrip',
  'isSelectable',
] as const;

function csvCell(value: unknown): string {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: readonly (keyof T | string)[],
): string {
  const header = columns.map((column) => csvCell(column)).join(',');
  const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(','));
  return [header, ...body].join('\r\n');
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function toExportTransaction(transaction: ExportTransaction): Record<string, unknown> {
  return {
    ...transaction,
    splitBy: transaction.splitBy?.join('|'),
    customSplitAmounts: transaction.customSplitAmounts
      ? JSON.stringify(transaction.customSplitAmounts)
      : undefined,
    splitPaidPersonIds: transaction.splitPaidPersonIds?.join('|'),
  };
}

export function toExportAdjustment(adjustment: ExportAdjustment): Record<string, unknown> {
  return { ...adjustment };
}

export function buildMonthlyReport(input: {
  generatedAt: string;
  monthName: string;
  totalWage: number;
  categories: MonthlyReport['categories'];
  adjustments: ExportAdjustment[];
  transactions: ExportTransaction[];
}): MonthlyReport {
  const totalSpend = input.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    generatedAt: input.generatedAt,
    currency: 'EUR',
    monthName: input.monthName,
    totalWage: input.totalWage,
    totalSpend,
    totalSaved: input.totalWage - totalSpend,
    categories: input.categories,
    adjustments: input.adjustments,
    transactions: input.transactions,
  };
}

export function buildFullBackup(input: {
  generatedAt: string;
  transactions: ExportTransaction[];
  adjustments: ExportAdjustment[];
  expenses: ExportExpenseSummary[];
}): FullExportBackup {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    generatedAt: input.generatedAt,
    currency: 'EUR',
    transactions: input.transactions,
    adjustments: input.adjustments,
    expenses: input.expenses,
  };
}

export function exportFilename(scope: 'monthly' | 'transactions' | 'adjustments' | 'backup', format: 'csv' | 'json', monthName?: string): string {
  const month = monthName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = scope === 'monthly' && month ? `expenses-report-${month}` : `expenses-${scope}`;
  return `${base}.${format}`;
}
