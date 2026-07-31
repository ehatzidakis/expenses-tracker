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

export const CATEGORY_BUDGETS: Record<string, number | null> = {
  Supermarket: 280,
  Medical: 200,
  Personal: 200,
  EatingOut: 140,
  Utilities: 100,
  Takeaway: 100,
  Tickets: 75,
  Gaming: 75,
  Cats: 50,
  Travel: 30,
  Subscriptions: 15,
  Gym: 70, // No budget limit defined
};

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
      const monthlyAverage =
        isAllTime && totalMonthsCount > 0 ? Math.ceil(amount / totalMonthsCount / 5) * 5 : null;
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
