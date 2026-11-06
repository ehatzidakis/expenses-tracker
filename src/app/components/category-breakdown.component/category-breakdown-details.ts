import { Component, computed, inject, input, output } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CategorySpend } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { TransactionService, monthTransactionsKey } from '../../services/transaction-service';
import { TransactionListComponent } from '../transaction-list/transaction-list';
import { YearlyCategorySumsComponent } from '../yearly-category-sums/yearly-category-sums';

@Component({
  selector: 'app-category-breakdown-details',
  standalone: true,
  imports: [TransactionListComponent, YearlyCategorySumsComponent],
  host: { class: 'block' },
  template: `
    @defer (on immediate) {
      @if (category().isAllTime) {
        <app-yearly-category-sums [category]="category().name" />
      } @else {
        <app-transaction-list
          [transactions]="transactions()"
          [loading]="monthQuery.isPending()"
          [error]="monthQuery.isError()"
          (selectTransaction)="selectTransaction.emit($event)"
        />
      }
    } @loading {
      <div class="mt-3 h-24 bg-raised/40 rounded-xl animate-pulse"></div>
    }
  `,
})
export class CategoryBreakdownDetailsComponent {
  private readonly transactionService = inject(TransactionService);

  readonly category = input.required<CategorySpend>();
  readonly monthName = input.required<string>();

  readonly selectTransaction = output<Transaction>();

  // Same query the breakdown already runs for its counts, so opening a category reads
  // nothing new from Firestore. Saves refresh it through the ['expenses'] invalidation.
  protected readonly monthQuery = injectQuery(() => ({
    queryKey: monthTransactionsKey(this.monthName()),
    enabled: !!this.monthName() && !this.category().isAllTime,
    queryFn: () => this.transactionService.fetchMonthTransactions(this.monthName()),
  }));

  /** This category's transactions for the month, trip ones included (matches the counts). */
  readonly transactions = computed<Transaction[]>(() =>
    (this.monthQuery.data() ?? []).filter((tx) => tx.category === this.category().name),
  );
}
