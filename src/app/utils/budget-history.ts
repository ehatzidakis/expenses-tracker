// Budgets change over time. Each period holds the full set of category budgets and the wage
// from its first month until the next period starts. Month keys are 'YYYY-MM' so they sort as text.
// Kept free of app imports: budget-settings.service depends on this file.

export interface BudgetPeriod {
  /** 'YYYY-MM': the first month this set applies to. */
  from: string;
  categoryBudgets: Record<string, number>;
  wage: number;
}

/** One stretch of months where a category kept the same budget. */
export interface CategoryBudgetStep {
  amount: number;
  from: string;
  /** Last month of the stretch; null while it still applies. */
  to: string | null;
}

export interface PeriodSummary {
  from: string;
  to: string | null;
  wage: number;
  budgeted: number;
  left: number;
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const pad = (month: number) => String(month).padStart(2, '0');
const cents = (value: number) => Math.round((Number(value) || 0) * 100);

/** 'March 2025' → '2025-03', or null when it can't be read. */
export function monthKey(monthName: string): string | null {
  const [label, yearText] = String(monthName ?? '').trim().split(/\s+/);
  const month = MONTHS.indexOf((label ?? '').toLowerCase());
  const year = Number(yearText);
  if (month === -1 || !Number.isInteger(year) || !yearText) return null;
  return `${year}-${pad(month + 1)}`;
}

/** The local calendar month of a date. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** '2026-03' → 'Mar 2026'. */
export function formatMonthKey(key: string): string {
  const [year, month] = key.split('-');
  const name = MONTHS[Number(month) - 1] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1, 3)} ${year}`;
}

/** The month before a key: '2026-03' → '2026-02', '2026-01' → '2025-12'. */
function previousMonth(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
}

/**
 * The period a month falls in. No month means today's (the latest). A month before the history
 * starts uses the first period, so old months always have a budget.
 */
export function periodFor(history: BudgetPeriod[], key?: string | null): BudgetPeriod | null {
  if (!history.length) return null;
  if (!key) return history[history.length - 1];
  let match = history[0];
  for (const period of history) {
    if (period.from <= key) match = period;
  }
  return match;
}

function samePeriodValues(a: BudgetPeriod, b: BudgetPeriod): boolean {
  if (cents(a.wage) !== cents(b.wage)) return false;
  const keys = new Set([...Object.keys(a.categoryBudgets), ...Object.keys(b.categoryBudgets)]);
  for (const key of keys) {
    if (cents(a.categoryBudgets[key]) !== cents(b.categoryBudgets[key])) return false;
  }
  return true;
}

/**
 * The history after saving `period`: it replaces any period starting the same month or later,
 * and is left out when it matches the period before it (nothing changed, or a change reverted).
 */
export function withSavedPeriod(history: BudgetPeriod[], period: BudgetPeriod): BudgetPeriod[] {
  const kept = history.filter((p) => p.from < period.from);
  const before = kept[kept.length - 1];
  return before && samePeriodValues(before, period) ? kept : [...kept, period];
}

/** A category's budget over time, newest first, merging periods where it didn't change. */
export function categoryHistory(history: BudgetPeriod[], category: string): CategoryBudgetStep[] {
  const steps: CategoryBudgetStep[] = [];
  history.forEach((period, i) => {
    const amount = Number(period.categoryBudgets[category]) || 0;
    const to = history[i + 1] ? previousMonth(history[i + 1].from) : null;
    const last = steps[steps.length - 1];
    if (last && cents(last.amount) === cents(amount)) {
      last.to = to;
    } else {
      steps.push({ amount, from: period.from, to });
    }
  });
  return steps.reverse();
}

/** Each period's wage, total budgeted and what it left to save, newest first. */
export function periodSummaries(history: BudgetPeriod[]): PeriodSummary[] {
  return history
    .map((period, i) => {
      const budgeted =
        Object.values(period.categoryBudgets).reduce((sum, v) => sum + cents(v), 0) / 100;
      return {
        from: period.from,
        to: history[i + 1] ? previousMonth(history[i + 1].from) : null,
        wage: period.wage,
        budgeted,
        left: (cents(period.wage) - cents(budgeted)) / 100,
      };
    })
    .reverse();
}
