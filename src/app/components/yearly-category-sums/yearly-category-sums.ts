import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Expense } from '../../models/expenses.model';
import { ExpenseStateService } from '../../services/expense-state.service';

interface YearlyCategorySum {
  year: number;
  total: number;
}

@Component({
  selector: 'app-yearly-category-sums',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './yearly-category-sums.html',
})
export class YearlyCategorySumsComponent {
  private readonly expenseState = inject(ExpenseStateService);

  category = input.required<string>();

  readonly yearlyTotals = computed<YearlyCategorySum[]>(() => {
    const totals = new Map<number, number>();

    for (const expense of this.expenseState.expensesQuery.data() ?? []) {
      const yearMatch = expense.MonthName.match(/(\d{4})$/);
      const year = yearMatch ? Number(yearMatch[1]) : null;
      if (year === null) continue;

      const categoryValue = Number(expense[this.category() as keyof Expense] ?? 0) || 0;
      totals.set(year, (totals.get(year) ?? 0) + categoryValue);
    }

    return [...totals.entries()]
      .map(([year, total]) => ({ year, total }))
      .sort((a, b) => a.year - b.year);
  });
}
