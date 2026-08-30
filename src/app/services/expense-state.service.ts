import { Injectable, inject, signal, computed } from '@angular/core';
import { ExpenseService } from './expense-service';
import { Expense } from '../models/expenses.model';

export interface CategorySpend {
  name: string;
  amount: number;
  monthlyAverage: number | null;
  isAllTime: boolean;
  percentage: number;
  budget: number | null;
  overallBudget: number | null;
  isOverBudget: boolean;
}

export type AppTab = 'monthly' | 'sumup' | 'create' | 'oneoffs' | 'charts';

export interface CategorySubcategoryOption {
  id: number;
  name: string;
  label: string;
}

export const TICKET_SUBCATEGORY_OPTIONS: CategorySubcategoryOption[] = [
  { id: 1, name: 'theatre', label: '🎭 Theatre' },
  { id: 2, name: 'movies', label: '🎬 Movies' },
  { id: 6, name: 'concert', label: '🎤 Concert' },
  { id: 3, name: 'standUp', label: '🤣 Stand Up' },
  { id: 4, name: 'escape', label: '🎃 Escape Room' },
  { id: 5, name: 'misc', label: '❓ Misc' },
];

export const GAMING_SUBCATEGORY_OPTIONS: CategorySubcategoryOption[] = [
  { id: 7, name: 'newRelease', label: '🎮 New Release' },
  { id: 8, name: 'olderTitle', label: '🕹️ Older Title' },
  { id: 9, name: 'subscription', label: '🔄 Subscription' },
  { id: 10, name: 'peripheral', label: '👾 Peripheral' },
  { id: 11, name: 'dlc', label: '🧩 DLC' },
];

export const CATEGORY_SUBCATEGORY_OPTIONS: Record<string, CategorySubcategoryOption[]> = {
  Tickets: TICKET_SUBCATEGORY_OPTIONS,
  Gaming: GAMING_SUBCATEGORY_OPTIONS,
};

export function categoryRequiresSubcategory(category: string): boolean {
  return (CATEGORY_SUBCATEGORY_OPTIONS[category] ?? []).length > 0;
}

export function getSubcategoryOptions(category: string): CategorySubcategoryOption[] {
  return CATEGORY_SUBCATEGORY_OPTIONS[category] ?? [];
}

export function getSubcategoryMetaById(
  category: string,
  subCategoryId?: number | null,
): CategorySubcategoryOption | undefined {
  if (subCategoryId == null) {
    return undefined;
  }

  return getSubcategoryOptions(category).find((option) => option.id === Number(subCategoryId));
}

export function getSubcategoryMetaByName(
  category: string,
  subCategory?: string | null,
): CategorySubcategoryOption | undefined {
  if (!subCategory) {
    return undefined;
  }

  return getSubcategoryOptions(category).find(
    (option) => option.name.toLowerCase() === String(subCategory).toLowerCase(),
  );
}

export const CATEGORY_BUDGETS: Record<string, number | null> = {
  Supermarket: 280,
  Medical: 200,
  Personal: 200,
  EatingOut: 130,
  Utilities: 110,
  Takeaway: 100,
  Tickets: 75,
  Gaming: 75,
  Cats: 50,
  Travel: 30,
  Subscriptions: 15,
  Gym: 65,
};

export const CATEGORY_NAMES = Object.keys(CATEGORY_BUDGETS);

export const CATEGORY_META: Record<string, { emoji: string; classes: string }> = {
  Supermarket: {
    emoji: '🛒',
    classes: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20',
  },
  Medical: {
    emoji: '❤️‍🩹',
    classes: 'bg-rose-500/15 text-rose-200 border border-rose-400/20',
  },
  Personal: {
    emoji: '👤',
    classes: 'bg-violet-500/15 text-violet-200 border border-violet-400/20',
  },
  EatingOut: {
    emoji: '🍽️',
    classes: 'bg-amber-500/15 text-amber-200 border border-amber-400/20',
  },
  Utilities: {
    emoji: '💡',
    classes: 'bg-yellow-500/15 text-yellow-200 border border-yellow-400/20',
  },
  Takeaway: {
    emoji: '🥡',
    classes: 'bg-orange-500/15 text-orange-200 border border-orange-400/20',
  },
  Tickets: {
    emoji: '🎟️',
    classes: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
  },
  Gaming: {
    emoji: '🎮',
    classes: 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20',
  },
  Cats: {
    emoji: '🐱',
    classes: 'bg-pink-500/15 text-pink-200 border border-pink-400/20',
  },
  Travel: {
    emoji: '🚅',
    classes: 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/20',
  },
  Subscriptions: {
    emoji: '📺',
    classes: 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20',
  },
  Gym: {
    emoji: '🏋️',
    classes: 'bg-teal-500/15 text-teal-200 border border-teal-400/20',
  },
  'Plane Tickets': {
    emoji: '🎫',
    classes: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
  },
  Accommodation: {
    emoji: '🏨',
    classes: 'bg-violet-500/15 text-violet-200 border border-violet-400/20',
  },
  Food: {
    emoji: '🍽️',
    classes: 'bg-amber-500/15 text-amber-200 border border-amber-400/20',
  },
  Transportation: {
    emoji: '🚅',
    classes: 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/20',
  },
  Gifts: {
    emoji: '🎁',
    classes: 'bg-pink-500/15 text-pink-200 border border-pink-400/20',
  },
  Activities: {
    emoji: '🎉',
    classes: 'bg-teal-500/15 text-teal-200 border border-teal-400/20',
  },
  Attractions: {
    emoji: '🏛️',
    classes: 'bg-yellow-500/15 text-yellow-200 border border-yellow-400/20',
  },
  Splurge: {
    emoji: '🤑',
    classes: 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20',
  },
  Miscellaneous: {
    emoji: '✨',
    classes: 'bg-slate-500/15 text-slate-200 border border-slate-400/20',
  },
};

export function getCategoryMeta(name: string): { emoji: string; classes: string } {
  return (
    CATEGORY_META[name] ?? {
      emoji: '•',
      classes: 'bg-slate-500/15 text-slate-200 border border-slate-400/20',
    }
  );
}

export const TRIP_CATEGORY_NAMES = [
  'Plane Tickets',
  'Accommodation',
  'Food',
  'Transportation',
  'Gifts',
  'Activities',
  'Attractions',
  'Splurge',
  'Miscellaneous',
];

export const DEFAULT_TOTAL_WAGE = 1600;

@Injectable({
  providedIn: 'root',
})
export class ExpenseStateService {
  private expenseService = inject(ExpenseService);

  private getTimestamp(monthName: string): number {
    if (!monthName) return 0;

    const months: Record<string, number> = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const [month, year] = monthName.split(' ');
    const monthIndex = months[month] ?? 0;
    const yearNum = parseInt(year, 10) || 1970;

    // Explicit constructor: new Date(year, monthIndex, day) works on every browser
    return new Date(yearNum, monthIndex, 1).getTime();
  }

  readonly expensesQuery = this.expenseService.getExpensesQuery();

  // Internal state
  readonly selectedExpenseId = signal<string | null>(null);
  readonly activeTab = signal<AppTab>('monthly');
  private readonly lastSelectedMonthId = signal<string | null>(null);

  readonly processedExpenses = computed<Expense[]>(() => {
    const rawList = this.expensesQuery.data() ?? [];
    if (!rawList.length) return [];

    // Sort by ID descending (converting to Number ensures '10' sorts correctly against '2')
    // const sortedList = [...rawList].sort((a, b) => Number(b.id) - Number(a.id));
    const sortedList = [...rawList].sort((a, b) => {
      return this.getTimestamp(b.MonthName) - this.getTimestamp(a.MonthName);
    });

    // Create the base aggregated record
    const aggregatedRecord: Expense = {
      id: 'ALL',
      MonthName: 'All Time',
      TotalWage: 0,
      Supermarket: 0,
      Medical: 0,
      Personal: 0,
      EatingOut: 0,
      Utilities: 0,
      Takeaway: 0,
      Tickets: 0,
      Gaming: 0,
      Cats: 0,
      Travel: 0,
      Subscriptions: 0,
      Gym: 0,
    };

    // Accumulate the totals for every month
    for (const expense of rawList) {
      aggregatedRecord.Supermarket += Number(expense.Supermarket) || 0;
      aggregatedRecord.Medical += Number(expense.Medical) || 0;
      aggregatedRecord.Personal += Number(expense.Personal) || 0;
      aggregatedRecord.EatingOut += Number(expense.EatingOut) || 0;
      aggregatedRecord.Utilities += Number(expense.Utilities) || 0;
      aggregatedRecord.Takeaway += Number(expense.Takeaway) || 0;
      aggregatedRecord.Tickets += Number(expense.Tickets) || 0;
      aggregatedRecord.Gaming += Number(expense.Gaming) || 0;
      aggregatedRecord.Cats += Number(expense.Cats) || 0;
      aggregatedRecord.Travel += Number(expense.Travel) || 0;
      aggregatedRecord.Subscriptions += Number(expense.Subscriptions) || 0;
      aggregatedRecord.Gym += Number(expense.Gym) || 0;
      aggregatedRecord.TotalWage += Number(expense.TotalWage) || 0;
    }

    // Prepend the aggregated record to the sorted list
    return [aggregatedRecord, ...sortedList];
  });

  // Dynamically detect the month with the highest ID (the most recent month)
  readonly latestMonthExpense = computed<Expense | null>(() => {
    const months = this.processedExpenses().filter((e) => e.id !== 'ALL');
    if (!months.length) return null;

    return months.reduce((latest, e) => (Number(e.id) > Number(latest.id) ? e : latest), months[0]);
  });

  // Derived state computations
  readonly selectedExpense = computed(() => {
    const list = this.processedExpenses();
    if (!list.length) return null;

    const currentId = this.selectedExpenseId();
    if (currentId) {
      return list.find((e) => e.id === currentId) ?? this.latestMonthExpense() ?? list[0];
    }

    return this.latestMonthExpense() ?? list[0];
  });

  readonly categoryBreakdown = computed<CategorySpend[]>(() => {
    const expense = this.selectedExpense();
    if (!expense) return [];

    const rawList = this.expensesQuery.data() ?? [];
    const totalMonthsCount = rawList.length;
    const isAllTime = expense.id === 'ALL';

    const excludedKeys = ['id', 'MonthName', 'TotalWage'];
    const entries = Object.entries(expense).filter(([key]) => !excludedKeys.includes(key));
    const total = entries.reduce((sum, [_, val]) => sum + (Number(val) || 0), 0);

    return entries.map(([name, val]) => {
      const amount = Number(val) || 0;
      const lastMonthExpense = this.latestMonthExpense();
      const currentMonthValue = Number(lastMonthExpense?.[name as keyof Expense] ?? 0);
      const amountExcludingCurrent = isAllTime ? Math.max(0, amount - currentMonthValue) : amount;
      const monthsExcludingCurrent = Math.max(0, totalMonthsCount - 1);
      const monthlyAverage =
        isAllTime && monthsExcludingCurrent > 0
          ? Math.ceil(amountExcludingCurrent / monthsExcludingCurrent / 5) * 5
          : null;
      const budget = CATEGORY_BUDGETS[name] ?? null;
      // For All Time, compare the normalized monthly average against the budget
      // instead of scaling the budget up, so it stays intuitive as a target.
      const comparisonAmount = monthlyAverage ?? amount;
      const isOverBudget = budget !== null && comparisonAmount > budget;
      const overallBudget = isAllTime && budget !== null ? budget * totalMonthsCount : null;

      return {
        name,
        amount,
        monthlyAverage,
        isAllTime,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        budget,
        overallBudget,
        isOverBudget,
      };
    });
  });

  readonly totalMonthlySpend = computed(() => {
    return this.categoryBreakdown().reduce((sum, item) => sum + item.amount, 0);
  });

  readonly selectedTotalWage = computed(() => {
    return Number(this.selectedExpense()?.TotalWage) || 0;
  });

  readonly dateRangeInfo = computed(() => {
    const rawList = this.expensesQuery.data() ?? [];
    if (!rawList.length) return null;

    const sorted = [...rawList].sort(
      (a, b) => this.getTimestamp(a.MonthName) - this.getTimestamp(b.MonthName),
    );

    return {
      count: sorted.length,
      first: sorted[0].MonthName,
      last: sorted[sorted.length - 1].MonthName,
    };
  });

  readonly topCategory = computed(() => {
    const breakdown = this.categoryBreakdown();
    return breakdown.length > 0 ? breakdown[0] : null;
  });

  selectMonth(id: string): void {
    this.selectedExpenseId.set(id);
    if (id !== 'ALL') {
      this.lastSelectedMonthId.set(id);
    }
  }

  setActiveTab(tab: AppTab): void {
    this.activeTab.set(tab);

    if (tab === 'sumup') {
      this.selectedExpenseId.set('ALL');
    } else if (tab === 'monthly' && this.selectedExpenseId() === 'ALL') {
      this.selectedExpenseId.set(
        this.lastSelectedMonthId() ?? this.latestMonthExpense()?.id ?? null,
      );
    }
  }
}
