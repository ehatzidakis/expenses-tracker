import { Component, computed, inject, signal } from '@angular/core';
import {
  comparePendingTransactionsByDate,
  PendingTransaction,
  TransactionService,
} from '../../services/transaction-service';
import { PendingReviewComponent } from './pending-review.component';
import { PendingTransactionListComponent } from './pending-transaction-list.component';

@Component({
  selector: 'app-splitz-incoming',
  standalone: true,
  imports: [PendingReviewComponent, PendingTransactionListComponent],
  host: { class: 'block' },
  template: `
    @if (selected(); as pending) {
      <app-pending-review
        [pending]="pending"
        (back)="selected.set(null)"
        (accepted)="selected.set(null)"
        (declined)="selected.set(null)"
      />
    } @else {
      <app-pending-transaction-list
        [items]="items()"
        [loading]="pendingQuery.isPending()"
        [error]="pendingQuery.isError()"
        [refreshing]="refreshing()"
        (select)="selected.set($event)"
        (refresh)="refresh()"
      />
    }
  `,
})
export class SplitzIncomingComponent {
  private readonly transactionService = inject(TransactionService);
  readonly pendingQuery = this.transactionService.getPendingTransactionsQuery();

  /** A snapshot, so a background refetch can't overwrite edits in progress. */
  readonly selected = signal<PendingTransaction | null>(null);
  readonly refreshing = signal(false);

  readonly items = computed(() =>
    [...(this.pendingQuery.data() ?? [])].sort(comparePendingTransactionsByDate),
  );

  async refresh(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    try {
      await this.pendingQuery.refetch();
    } finally {
      this.refreshing.set(false);
    }
  }
}
