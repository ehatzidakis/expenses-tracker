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
  template: `<div class="mt-3 pt-3 border-t border-gray-800/60 space-y-1">
    @if (yearlyTotals().length) {
      @for (entry of yearlyTotals(); track entry.year) {
        <div
          class="w-full text-left p-3.5 border border-gray-800/80 bg-gray-900/60 rounded-xl flex items-center justify-between transition-colors"
        >
          <div class="min-w-0">
            <span class="text-xs font-medium text-gray-200 truncate block"
              >Total spend for {{ entry.year }}</span
            >
            <!-- <span class="text-[10px] text-gray-500 block mt-0.5">Category total</span> -->
          </div>
          <span class="text-xs font-semibold text-white shrink-0 ml-2 tabular-nums">
            €{{ entry.total | number: '1.2-2' }}
          </span>
        </div>
      }
    } @else {
      <div class="text-center text-xs text-gray-500 py-4">No yearly data found.</div>
    }
  </div> `,
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
