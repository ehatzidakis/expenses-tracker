import { getSubcategoryMetaById } from '../../services/expense-state.service';
import type { NewTransactionInput } from '../../services/transaction-service';
import type { Transaction } from '../../models/transaction.model';
import {
  shouldSaveTransactionForApproval,
  TransactionFormModel,
} from './create-transaction.models';
import { RecurringTemplate } from './recurring-templates';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseYearMonth(date: string): { year: number; month: number } | null {
  const match = DATE_PATTERN.exec(date);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** 'YYYY-MM-DD' → 'November 2026' (same format as the `monthName` field in Firestore). */
export function monthNameFromDate(date: string): string {
  const parsed = parseYearMonth(date);
  if (!parsed) return '';
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

/** 'YYYY-MM-DD' → name of the month before it, e.g. '2026-01-15' → 'December 2025'. */
export function previousMonthName(date: string): string {
  const parsed = parseYearMonth(date);
  if (!parsed) return '';
  const month = parsed.month === 1 ? 12 : parsed.month - 1;
  const year = parsed.month === 1 ? parsed.year - 1 : parsed.year;
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Keeps the year and month of `date` and sets the day, clamped to the month's length. */
export function withDayOfMonth(date: string, day: number): string {
  const parsed = parseYearMonth(date);
  if (!parsed) return date;
  const daysInMonth = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  const clamped = Math.min(Math.max(1, day), daysInMonth);
  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

export function applyTemplate(
  model: TransactionFormModel,
  template: RecurringTemplate,
): TransactionFormModel {
  const subcategory = getSubcategoryMetaById(template.category, template.subCategoryId);
  return {
    ...model,
    description: template.description || model.description,
    category: template.category,
    subCategoryId: subcategory?.id ?? null,
    subCategory: subcategory?.name ?? '',
    amount: template.amount ?? 0,
    date:
      template.dayOfMonth != null ? withDayOfMonth(model.date, template.dayOfMonth) : model.date,
  };
}

type MatchableEntry = Pick<Transaction, 'category' | 'description'> & {
  subCategoryId?: number | null;
};

export function matchesTemplate(template: RecurringTemplate, entry: MatchableEntry): boolean {
  if (entry.category !== template.category) return false;
  if (template.subCategoryId != null) {
    return Number(entry.subCategoryId) === template.subCategoryId;
  }
  if (template.match) {
    return (entry.description ?? '')
      .toLowerCase()
      .includes(template.match.descriptionIncludes.toLowerCase());
  }
  return true;
}

/** True when a saved or pending entry for this template already exists in `monthName`. */
export function isTemplateAdded(
  template: RecurringTemplate,
  monthTransactions: ReadonlyArray<Transaction>,
  pending: ReadonlyArray<NewTransactionInput>,
  monthName: string,
): boolean {
  return (
    monthTransactions.some((tx) => !tx.adjustmentId && matchesTemplate(template, tx)) ||
    pending.some(
      (item) =>
        !item.adjustmentId &&
        monthNameFromDate(item.date) === monthName &&
        matchesTemplate(template, item),
    )
  );
}

/** Full bill amount of the latest matching transaction, or null if there is none. */
export function lastAmountFor(
  template: RecurringTemplate,
  transactions: ReadonlyArray<Transaction>,
): number | null {
  const latest = transactions
    .filter((tx) => !tx.adjustmentId && matchesTemplate(template, tx))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
  if (!latest) return null;
  const total = latest.isSplit && latest.totalAmount ? latest.totalAmount : latest.amount;
  return total > 0 ? total : null;
}

export interface MonthlyBatch {
  /** Saved straight away as transactions. */
  direct: NewTransactionInput[];
  /** Saved to Pending, to be reviewed (and given an amount) later. */
  pending: NewTransactionInput[];
}

export function buildMonthlyBatch(
  templates: ReadonlyArray<RecurringTemplate>,
  targetDate: string,
  addedIds: ReadonlySet<string>,
  now = new Date(),
): MonthlyBatch {
  const batch: MonthlyBatch = { direct: [], pending: [] };

  for (const template of templates) {
    if (!template.monthly || addedIds.has(template.id)) continue;

    const subcategory = getSubcategoryMetaById(template.category, template.subCategoryId);
    const date = withDayOfMonth(targetDate, template.dayOfMonth ?? 1);
    const amount = template.amount ?? 0;
    const payload: NewTransactionInput = {
      date,
      description: template.description,
      category: template.category,
      subCategoryId: subcategory?.id,
      subCategory: subcategory?.name,
      amount,
    };

    if (template.amount == null || shouldSaveTransactionForApproval(date, undefined, now)) {
      batch.pending.push(payload);
    } else {
      batch.direct.push(payload);
    }
  }

  return batch;
}
