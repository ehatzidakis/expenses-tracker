import { Component, computed, inject, input, signal } from '@angular/core';
import { Transaction } from '../../models/transaction.model';
import { injectQuery } from '@tanstack/angular-query-experimental';
import {
  TransactionService,
  compareNewestFirst,
  monthTransactionsKey,
  tripTransactionsKey,
} from '../../services/transaction-service';
import { TRIP_CATEGORY_NAMES } from '../../services/expense-state.service';
import { TransactionListComponent } from '../transaction-list/transaction-list';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { SheetComponent } from '../sheet/sheet';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [TransactionListComponent, EditTransactionComponent, SheetComponent],
  host: { class: 'block' },
  template: `
    <section aria-labelledby="recent-heading" class="border-t border-ink/10">
      <button
        type="button"
        class="flex min-h-12 w-full items-center justify-between gap-3 text-left cursor-pointer"
        [attr.aria-expanded]="expanded()"
        aria-controls="recent-transactions-list"
        (click)="expanded.update((value) => !value)"
      >
        <h2 id="recent-heading" class="type-wide text-[13px] font-semibold uppercase text-ink-2">
          Recent
          @if (transactions().length) {
            <span class="ml-1 font-normal normal-case text-ink-3">{{ transactions().length }}</span>
          }
        </h2>
        <span class="text-[13px] text-ink-3">{{ expanded() ? 'Hide' : 'Show' }}</span>
      </button>

      @if (expanded()) {
        <div id="recent-transactions-list">
          @if (!loading() && !error() && !transactions().length) {
            <p class="pb-3 text-[13px] text-ink-3">No transactions yet.</p>
          } @else {
            <app-transaction-list
              [transactions]="transactions()"
              [loading]="loading()"
              [error]="error()"
              [showCategory]="!adjustmentId()"
              (selectTransaction)="selected.set($event)"
            />
          }
        </div>
      }
    </section>

    @if (selected(); as transaction) {
      <app-sheet label="Edit transaction" (closed)="selected.set(null)">
        <app-edit-transaction
          [transaction]="transaction"
          [categoryOverride]="adjustmentId() ? tripCategories : null"
          (back)="selected.set(null)"
          (updated)="selected.set(null)"
          (deleted)="selected.set(null)"
        />
      </app-sheet>
    }
  `,
})
export class RecentTransactionsComponent {
  private readonly transactionService = inject(TransactionService);

  readonly monthName = input<string | null>(null);
  readonly adjustmentId = input<string | null>(null);
  readonly expanded = signal(false);
  readonly selected = signal<Transaction | null>(null);
  readonly tripCategories = TRIP_CATEGORY_NAMES;

  // Month mode shares the cached month query with the category counts and the Add tab; trip
  // mode shares the trip query with the trip breakdown. Saves refresh both through ['expenses'].
  private readonly listQuery = injectQuery(() => {
    const adjustmentId = this.adjustmentId();
    const monthName = this.monthName() ?? '';
    return adjustmentId
      ? {
          queryKey: tripTransactionsKey(adjustmentId),
          enabled: this.expanded(),
          queryFn: () => this.transactionService.fetchTripTransactions(adjustmentId),
        }
      : {
          queryKey: monthTransactionsKey(monthName),
          enabled: this.expanded() && !!monthName,
          queryFn: () => this.transactionService.fetchMonthTransactions(monthName),
        };
  });

  readonly transactions = computed<Transaction[]>(() => {
    const tripMode = !!this.adjustmentId();
    return (this.listQuery.data() ?? [])
      .filter((transaction) => tripMode || !transaction.adjustmentId)
      .sort(compareNewestFirst);
  });
  readonly loading = computed(() => this.listQuery.isPending());
  readonly error = computed(() => this.listQuery.isError());
}
