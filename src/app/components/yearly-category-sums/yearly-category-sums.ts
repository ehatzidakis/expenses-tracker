import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Expense } from '../../models/expenses.model';
import { ExpenseStateService } from '../../services/expense-state.service';
import { SensitiveDirective } from '../../utils/sensitive.directive';

interface YearlyCategorySum {
  year: number;
  total: number;
}

@Component({
  selector: 'app-yearly-category-sums',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    @if (yearlyTotals().length) {
      <ul class="divide-y divide-ink/10 border-y border-ink/10">
        @for (entry of yearlyTotals(); track entry.year) {
          <li class="flex min-h-11 items-center justify-between gap-3 py-2.5">
            <span class="text-[14px] text-ink">Spent in {{ entry.year }}</span>
            <span class="shrink-0 text-[13px] font-medium text-ink tabular-nums" appSensitive="xs">
              €{{ entry.total | number: '1.2-2' }}
            </span>
          </li>
        }
      </ul>
    } @else {
      <p class="py-4 text-[13px] text-ink-3">No yearly data yet.</p>
    }
  `,
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
