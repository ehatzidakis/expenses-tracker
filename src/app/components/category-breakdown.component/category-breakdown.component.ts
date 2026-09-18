import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CategorySpend } from '../../services/expense-state.service';
import { TransactionService } from '../../services/transaction-service';
import { CategoryBreakdownItemComponent } from './category-breakdown-item';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CategoryBreakdownItemComponent],
  host: { class: 'block' },
  template: `
    <section
      class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-2 space-y-4 backdrop-blur-sm"
    >
      <div class="space-y-2">
        @for (category of categories(); track category.name) {
          <app-category-breakdown-item
            [category]="category"
            [monthName]="monthName()"
            [transactionCount]="transactionCounts()[category.name] ?? 0"
            [expanded]="expandedCategory() === category.name"
            (toggle)="toggleCategory(category.name)"
            (changed)="onEditFinished()"
          />
        }
      </div>
    </section>
  `,
})
export class CategoryBreakdownComponent {
  private readonly transactionService = inject(TransactionService);

  readonly categories = input.required<CategorySpend[]>();
  readonly monthName = input<string>('');

  readonly budgetTitle = computed(() => {
    const month = this.monthName().trim();

    if (!month || month.toLowerCase() === 'all time') {
      return 'All-Time Budget';
    }

    const monthOnly = month.replace(/\s+\d{4}\s*$/, '').trim();
    return `${monthOnly}'s Budget`;
  });

  readonly expandedCategory = signal<string | null>(null);
  readonly transactionCounts = signal<Record<string, number>>({});
  private readonly transactionCountCache = new Map<string, Record<string, number>>();
  private transactionCountRequestId = 0;

  constructor() {
    effect(() => {
      const month = this.monthName();
      const currentCategories = this.categories();

      if (!month || currentCategories.length === 0) {
        this.transactionCounts.set({});
        return;
      }

      void this.loadTransactionCounts(month, currentCategories);
    });
  }

  private async loadTransactionCounts(
    month: string,
    currentCategories: CategorySpend[],
  ): Promise<void> {
    const requestId = ++this.transactionCountRequestId;
    const categoryNames = currentCategories.map((category) => category.name);
    const cachedCounts = this.transactionCountCache.get(month);

    if (cachedCounts && categoryNames.every((name) => name in cachedCounts)) {
      this.transactionCounts.set(cachedCounts);
      return;
    }

    const counts = await this.transactionService.countTransactionsByCategory(month, categoryNames);

    this.transactionCountCache.set(month, counts);
    if (requestId !== this.transactionCountRequestId) {
      return;
    }
    this.transactionCounts.set(counts);
  }

  toggleCategory(name: string): void {
    this.expandedCategory.update((current) => (current === name ? null : name));
  }

  onEditFinished(): void {
    const month = this.monthName();
    const currentCategories = this.categories();

    this.transactionCountCache.delete(month);
    void this.loadTransactionCounts(month, currentCategories);
  }
}
