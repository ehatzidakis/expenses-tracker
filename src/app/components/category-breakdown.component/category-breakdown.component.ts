import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Adjustment } from '../../models/adjustments.model';
import { Expense } from '../../models/expenses.model';
import { CategorySpend } from '../../services/expense-state.service';
import { TransactionService, monthTransactionsKey } from '../../services/transaction-service';
import { CategoryBreakdownItemComponent } from './category-breakdown-item';
import { MonthBreakdownComponent } from '../month-breakdown/month-breakdown.component';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, CategoryBreakdownItemComponent, MonthBreakdownComponent],
  host: { class: 'block' },
  template: `
    <section
      class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-2 space-y-4 backdrop-blur-sm"
    >
      @if (showMonthView()) {
        <div class="flex justify-center">
          <div class="inline-flex rounded-full border border-gray-700/80 bg-gray-950/60 p-1">
            <button
              type="button"
              class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              [class.bg-gray-700]="viewMode() === 'category'"
              [class.text-white]="viewMode() === 'category'"
              [class.text-gray-400]="viewMode() !== 'category'"
              (click)="viewMode.set('category')"
            >
              Category
            </button>
            <button
              type="button"
              class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              [class.bg-gray-700]="viewMode() === 'month'"
              [class.text-white]="viewMode() === 'month'"
              [class.text-gray-400]="viewMode() !== 'month'"
              (click)="viewMode.set('month')"
            >
              Month
            </button>
          </div>
        </div>
      }

      @if (viewMode() === 'month' && showMonthView()) {
        <app-month-breakdown [months]="months()" [adjustments]="adjustments()" />
      } @else {
        <div class="space-y-2">
          @for (category of categories(); track category.name) {
            <app-category-breakdown-item
              [category]="category"
              [monthName]="monthName()"
              [transactionCount]="transactionCounts()[category.name] ?? 0"
              [expanded]="expandedCategory() === category.name"
              (toggle)="toggleCategory(category.name)"
            />
          }
        </div>
      }
    </section>
  `,
})
export class CategoryBreakdownComponent {
  private readonly transactionService = inject(TransactionService);

  readonly categories = input.required<CategorySpend[]>();
  readonly monthName = input<string>('');
  readonly months = input<Expense[]>([]);
  readonly adjustments = input<Adjustment[]>([]);
  readonly viewMode = signal<'category' | 'month'>('category');

  readonly showMonthView = computed(() => this.months().length > 0);

  readonly budgetTitle = computed(() => {
    const month = this.monthName().trim();

    if (!month || month.toLowerCase() === 'all time') {
      return 'All-Time Budget';
    }

    const monthOnly = month.replace(/\s+\d{4}\s*$/, '').trim();
    return `${monthOnly}'s Budget`;
  });

  readonly expandedCategory = signal<string | null>(null);

  // Shares the cached month query with Recent Transactions and the Create tab's quick-picks,
  // so counting costs no extra reads. Saves refresh it through the ['expenses'] invalidation.
  private readonly monthQuery = injectQuery(() => ({
    queryKey: monthTransactionsKey(this.monthName()),
    enabled: !!this.monthName() && this.categories().length > 0,
    queryFn: () => this.transactionService.fetchMonthTransactions(this.monthName()),
  }));

  /** Transactions per category for the month, trip ones included (matches the transaction grid). */
  readonly transactionCounts = computed<Record<string, number>>(() => {
    if (!this.monthName()) return {};
    const counts: Record<string, number> = {};
    for (const transaction of this.monthQuery.data() ?? []) {
      counts[transaction.category] = (counts[transaction.category] ?? 0) + 1;
    }
    return counts;
  });

  toggleCategory(name: string): void {
    this.expandedCategory.update((current) => (current === name ? null : name));
  }
}
