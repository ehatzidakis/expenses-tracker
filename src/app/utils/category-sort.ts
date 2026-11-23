import type { CategorySpend } from '../services/expense-state.service';

/** How the Budget tab orders its category rows. Every sort but the default runs both ways. */
export type CategorySort =
  | 'default'
  | 'spent-desc'
  | 'spent-asc'
  | 'left-desc'
  | 'left-asc'
  | 'over-desc'
  | 'over-asc';

export interface CategorySortOption {
  id: CategorySort;
  /** Full wording, for the menu. */
  label: string;
  /** Short wording, for the button beside the heading. */
  short: string;
}

/** Menu order: the default, then each sort with its reverse right under it. */
export const CATEGORY_SORTS: readonly CategorySortOption[] = [
  { id: 'default', label: 'Default order', short: 'Default' },
  { id: 'spent-desc', label: 'Most spent', short: 'Most spent' },
  { id: 'spent-asc', label: 'Least spent', short: 'Least spent' },
  { id: 'left-desc', label: 'Most left', short: 'Most left' },
  { id: 'left-asc', label: 'Least left', short: 'Least left' },
  { id: 'over-desc', label: 'Most over budget', short: 'Most over' },
  { id: 'over-asc', label: 'Furthest under budget', short: 'Most under' },
];

export function isCategorySort(value: unknown): value is CategorySort {
  return CATEGORY_SORTS.some((option) => option.id === value);
}

/** The fixed order the Budget tab has always used; categories not listed follow in their own order. */
export const DEFAULT_CATEGORY_ORDER = [
  'Supermarket',
  'Personal',
  'Medical',
  'Utilities',
  'EatingOut',
  'Takeaway',
  'Tickets',
  'Gaming',
  'Cats',
  'Travel',
  'Subscriptions',
  'Gym',
];

/** What a row is measured against its budget with: the month's spend, or the all-time monthly average. */
function compared(category: CategorySpend): number {
  return category.isAllTime ? (category.monthlyAverage ?? category.amount) : category.amount;
}

/**
 * The number a sort ranks by, or null when the category can't be ranked that way
 * (no budget to measure "left" or "over" against). Unrankable rows go last, in default order.
 */
function sortValue(category: CategorySpend, sort: CategorySort): number | null {
  const budget = category.budget;
  switch (sort) {
    case 'spent-desc':
    case 'spent-asc':
      return category.amount;
    case 'left-desc':
    case 'left-asc':
      // Euros left this month (or per month on average, for all time); negative when over.
      return budget ? budget - compared(category) : null;
    case 'over-desc':
    case 'over-asc':
      // Share of the budget used, so €5 over a €15 budget outranks €20 over a €280 one.
      return budget ? compared(category) / budget : null;
    default:
      return null;
  }
}

export function sortCategories(categories: readonly CategorySpend[], sort: CategorySort): CategorySpend[] {
  const position = (name: string) => {
    const i = DEFAULT_CATEGORY_ORDER.indexOf(name);
    return i === -1 ? DEFAULT_CATEGORY_ORDER.length + categories.findIndex((c) => c.name === name) : i;
  };
  const direction = sort.endsWith('-asc') ? 1 : -1;

  return [...categories].sort((a, b) => {
    const va = sortValue(a, sort);
    const vb = sortValue(b, sort);
    if (va !== null && vb !== null && Math.abs(va - vb) > 1e-9) return (va - vb) * direction;
    if (va !== null && vb === null) return -1;
    if (va === null && vb !== null) return 1;
    return position(a.name) - position(b.name);
  });
}
