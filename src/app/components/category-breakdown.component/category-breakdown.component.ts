import { Component, computed, inject, input, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Adjustment } from '../../models/adjustments.model';
import { Expense } from '../../models/expenses.model';
import { CategorySpend } from '../../services/expense-state.service';
import { TransactionService, monthTransactionsKey } from '../../services/transaction-service';
import { CategoryBreakdownItemComponent } from './category-breakdown-item';
import { MonthBreakdownComponent } from '../month-breakdown/month-breakdown.component';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { SheetComponent } from '../sheet/sheet';
import { Transaction } from '../../models/transaction.model';
import { STATUS_RANK, budgetStatus, categoryLabel } from '../../utils/period-pace';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CategoryBreakdownItemComponent, EditTransactionComponent, MonthBreakdownComponent, SheetComponent],
  host: { class: 'block' },
  template: `
    <section aria-labelledby="categories-heading">
      <div class="flex min-h-11 items-center justify-between gap-3">
        <h2 id="categories-heading" class="type-wide text-[13px] font-semibold uppercase text-ink-2">
          {{ viewMode() === 'month' && showMonthView() ? 'Months' : 'Categories' }}
        </h2>

        @if (showMonthView()) {
          <div
            role="group"
            aria-label="Group by"
            class="inline-flex rounded-xl border border-edge p-0.5"
          >
            @for (mode of modes; track mode.id) {
              <button
                type="button"
                class="min-h-11 rounded-[10px] px-3.5 text-[13px] font-medium transition-colors cursor-pointer"
                [class]="viewMode() === mode.id ? 'bg-ember/20 text-ink ring-1 ring-inset ring-ember/60' : 'text-ink-3 hover:text-ink'"
                [attr.aria-pressed]="viewMode() === mode.id"
                (click)="viewMode.set(mode.id)"
              >
                {{ mode.label }}
              </button>
            }
          </div>
        }
      </div>

      @if (viewMode() === 'month' && showMonthView()) {
        <app-month-breakdown class="mt-2 block" [months]="months()" [adjustments]="adjustments()" />
      } @else {
        <div class="divide-y divide-ink/10 border-t border-ink/10">
          @for (category of activeCategories(); track category.name) {
            <app-category-breakdown-item
              [category]="category"
              [monthName]="monthName()"
              [pace]="pace()"
              [transactionCount]="transactionCounts()[category.name] ?? 0"
              [expanded]="expandedCategory() === category.name"
              [dimmed]="expandedCategory() !== null && expandedCategory() !== category.name"
              (toggle)="toggleCategory(category.name)"
              (selectTransaction)="selectedTransaction.set($event)"
            />
          }

          @if (quietCategories().length) {
            @if (showQuiet()) {
              @for (category of quietCategories(); track category.name) {
                <app-category-breakdown-item
                  [category]="category"
                  [monthName]="monthName()"
                  [pace]="pace()"
                  [transactionCount]="0"
                  [expanded]="expandedCategory() === category.name"
                  [dimmed]="expandedCategory() !== null && expandedCategory() !== category.name"
                  (toggle)="toggleCategory(category.name)"
                  (selectTransaction)="selectedTransaction.set($event)"
                />
              }
            }
            <button
              type="button"
              class="flex min-h-12 w-full items-center justify-between gap-3 text-left text-[13px] text-ink-3 hover:text-ink cursor-pointer"
              [attr.aria-expanded]="showQuiet()"
              (click)="showQuiet.update((v) => !v)"
            >
              <span>
                {{ showQuiet() ? 'Hide' : quietCategories().length + ' quiet' }} ·
                <span class="text-ink-4">{{ quietNames() }}</span>
              </span>
              <svg
                class="size-3.5 shrink-0 transition-transform duration-200"
                [class.rotate-180]="showQuiet()"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          }
        </div>
      }
    </section>

    @if (selectedTransaction(); as transaction) {
      <app-sheet label="Edit transaction" (closed)="selectedTransaction.set(null)">
        <app-edit-transaction
          [transaction]="transaction"
          (back)="selectedTransaction.set(null)"
          (updated)="selectedTransaction.set(null)"
          (deleted)="selectedTransaction.set(null)"
        />
      </app-sheet>
    }
  `,
})
export class CategoryBreakdownComponent {
  private readonly transactionService = inject(TransactionService);

  readonly categories = input.required<CategorySpend[]>();
  readonly monthName = input<string>('');
  readonly months = input<Expense[]>([]);
  readonly adjustments = input<Adjustment[]>([]);
  /** Share of the month gone by today; drives "ahead of pace" and the stripe notches. */
  readonly pace = input<number | null>(null);

  readonly viewMode = signal<'category' | 'month'>('category');
  readonly modes = [
    { id: 'category' as const, label: 'Category' },
    { id: 'month' as const, label: 'Month' },
  ];

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
  readonly selectedTransaction = signal<Transaction | null>(null);
  readonly showQuiet = signal(false);

  /** Trouble first: over, ahead of pace, full, on pace, unbudgeted. Biggest gap leads each group. */
  readonly sortedCategories = computed(() => {
    const pace = this.pace();
    return [...this.categories()]
      .map((category) => {
        const status = category.isAllTime
          ? category.amount <= 0
            ? 'quiet'
            : category.isOverBudget
              ? 'over'
              : 'ok'
          : budgetStatus(category.amount, category.budget, pace);
        return { category, rank: STATUS_RANK[status] };
      })
      // Biggest spend first, whatever its budget; categories with nothing spent fold away below.
      .sort((a, b) => b.category.amount - a.category.amount);
  });

  readonly activeCategories = computed(() =>
    this.sortedCategories()
      .filter((entry) => entry.rank !== STATUS_RANK.quiet)
      .map((entry) => entry.category),
  );

  readonly quietCategories = computed(() =>
    this.sortedCategories()
      .filter((entry) => entry.rank === STATUS_RANK.quiet)
      .map((entry) => entry.category),
  );

  readonly quietNames = computed(() =>
    this.quietCategories()
      .map((category) => categoryLabel(category.name))
      .join(', '),
  );

  // Shares the cached month query with Recent Transactions and the Add tab's quick-picks,
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
