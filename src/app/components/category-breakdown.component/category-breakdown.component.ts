import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { CategorySpend, getCategoryMeta } from '../../services/expense-state.service';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';
import { YearlyCategorySumsComponent } from '../yearly-category-sums/yearly-category-sums';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction-service';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [
    CommonModule,
    TransactionGridComponent,
    EditTransactionComponent,
    YearlyCategorySumsComponent,
  ],
  host: { class: 'block' },
  templateUrl: './category-breakdown.component.html',
})
export class CategoryBreakdownComponent {
  private readonly transactionService = inject(TransactionService);

  categories = input.required<CategorySpend[]>();
  monthName = input<string>('');
  selectedTransaction = signal<Transaction | null>(null);

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

  protected readonly Math = Math;

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

  categoryMeta(name: string): { emoji: string; classes: string } {
    return getCategoryMeta(name);
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
    this.selectedTransaction.set(null);
    this.expandedCategory.update((current) => (current === name ? null : name));
  }

  onSelectTransaction(tx: Transaction): void {
    console.log('Parent received selected transaction:', tx);
    this.selectedTransaction.set(tx);
  }

  onEditFinished(): void {
    this.selectedTransaction.set(null);
    this.transactionCountCache.delete(this.monthName());
  }
}
