import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { TransactionService, tripTransactionsKey } from '../../services/transaction-service';
import { Adjustment } from '../../models/adjustments.model';
import { TRIP_CATEGORY_NAMES, getCategoryMeta } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { EditAdjustmentComponent } from '../edit-adjustment.component/edit-adjustment.component';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { TransactionListComponent } from '../transaction-list/transaction-list';
import { BreakdownRowComponent } from '../breakdown-row/breakdown-row';
import { SheetComponent } from '../sheet/sheet';
import { daysInRange } from '../../utils/period-pace';

interface TripCategoryRow {
  name: string;
  amount: number;
  transactions: Transaction[];
}

@Component({
  selector: 'app-trip-breakdown',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    EditTransactionComponent,
    EditAdjustmentComponent,
    SensitiveDirective,
    TransactionListComponent,
    BreakdownRowComponent,
    SheetComponent,
  ],
  host: { class: 'flex flex-col gap-5' },
  template: `
    <!-- Trip summary -->
    <section
      class="rounded-2xl border border-ink/10 bg-panel px-5 pt-4 pb-5 shadow-[inset_0_1px_0_rgb(241_230_210/0.06)]"
      aria-label="Trip summary"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="type-wide text-[18px] font-semibold leading-tight text-ink line-clamp-2">
            {{ trip().title }}
          </h2>
          <p class="mt-1 text-[13px] text-ink-2">
            @if (days() === 1) {
              {{ trip().startDate | date: 'd MMM y' }}
            } @else {
              {{ trip().startDate | date: 'd MMM' }} – {{ trip().endDate | date: 'd MMM y' }}
            }
            <span
              class="ml-1.5 inline-flex items-center rounded-md border px-1.5 py-px text-[11px] font-medium"
              [class]="trip().isSelectable ? 'border-avocado/40 text-avocado' : 'border-edge text-ink-3'"
            >
              {{ trip().isSelectable ? 'Open' : 'Closed' }}
            </span>
          </p>
        </div>
        <button
          type="button"
          class="-mr-1 shrink-0 min-h-11 rounded-xl border border-edge px-3.5 text-[13px] font-medium text-ink-2 hover:border-ink-4 hover:text-ink cursor-pointer"
          (click)="editingTrip.set(true)"
        >
          Edit trip
        </button>
      </div>

      <p class="mt-4 type-wide text-[40px] font-bold leading-none tracking-[-0.02em] text-ink" appSensitive>
        €{{ trip().amount | number: '1.2-2' }}
      </p>
      <p class="mt-2 text-[14px] text-ink-2" appSensitive="xs">
        {{ days() }} day{{ days() === 1 ? '' : 's' }} · €{{ perDay() | number: '1.2-2' }} a day
      </p>
      @if (unitemised() > 0) {
        <p class="trip-gap mt-1 text-[13px] text-ink-3" appSensitive="xs">
          €{{ unitemised() | number: '1.2-2' }} not itemised
        </p>
      } @else if (unitemised() < 0) {
        <p class="trip-gap mt-1 text-[13px] text-ink-3" appSensitive="xs">
          Transactions add up to €{{ totalSpent() | number: '1.2-2' }}
        </p>
      }
    </section>

    <!-- Category breakdown -->
    <section aria-labelledby="trip-categories-heading">
      <h2
        id="trip-categories-heading"
        class="type-wide flex min-h-11 items-center text-[13px] font-semibold uppercase text-ink-2"
      >
        Categories
      </h2>

      @if (loading()) {
        <div class="space-y-2 animate-pulse" aria-label="Loading trip transactions">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-14 rounded-lg bg-raised/70"></div>
          }
        </div>
      } @else if (error()) {
        <div role="alert" class="flex items-center justify-between gap-3 border-t border-ink/10 py-3">
          <p class="text-[13px] text-cherry">Couldn't load this trip's transactions.</p>
          <button
            type="button"
            class="min-h-11 shrink-0 rounded-xl border border-edge px-3.5 text-[13px] font-medium text-ink-2 hover:text-ink cursor-pointer"
            (click)="retry()"
          >
            Try again
          </button>
        </div>
      } @else if (categoryRows().length === 0) {
        <p class="border-t border-ink/10 py-3 text-[13px] text-ink-3">No transactions yet.</p>
      } @else {
        <div class="divide-y divide-ink/10 border-t border-ink/10">
          @for (row of categoryRows(); track row.name) {
            <app-breakdown-row
              [label]="row.name"
              [emoji]="emoji(row.name)"
              [amount]="row.amount"
              [ratio]="share(row)"
              tone="share"
              [statusText]="formatPercent(share(row) * 100) + '% of the trip'"
              [meta]="row.transactions.length + ' transaction' + (row.transactions.length === 1 ? '' : 's')"
              [expanded]="expandedCategory() === row.name"
              [dimmed]="expandedCategory() !== null && expandedCategory() !== row.name"
              (toggle)="toggleCategory(row.name)"
            >
              @if (expandedCategory() === row.name) {
                <app-transaction-list
                  [transactions]="row.transactions"
                  (selectTransaction)="selectedTransaction.set($event)"
                />
              }
            </app-breakdown-row>
          }
        </div>
      }
    </section>

    @if (editingTrip()) {
      <app-sheet label="Edit trip" (closed)="editingTrip.set(false)">
        <app-edit-adjustment
          [adjustment]="trip()"
          (back)="editingTrip.set(false)"
          (updated)="editingTrip.set(false)"
          (deleted)="editingTrip.set(false)"
        />
      </app-sheet>
    }

    @if (selectedTransaction(); as tx) {
      <app-sheet label="Edit transaction" (closed)="selectedTransaction.set(null)">
        <app-edit-transaction
          [transaction]="tx"
          [categoryOverride]="tripCategories"
          (back)="selectedTransaction.set(null)"
          (updated)="selectedTransaction.set(null)"
          (deleted)="selectedTransaction.set(null)"
        />
      </app-sheet>
    }
  `,
})
export class TripBreakdownComponent {
  private transactionService = inject(TransactionService);

  trip = input.required<Adjustment>();

  readonly tripCategories = TRIP_CATEGORY_NAMES;
  readonly editingTrip = signal(false);

  // Shares the trip cache with Recent Transactions, so the trip is read once. Saves refresh
  // it through the ['expenses'] invalidation, so there is no manual reload after an edit.
  private readonly tripQuery = injectQuery(() => ({
    queryKey: tripTransactionsKey(this.trip().id),
    queryFn: () => this.transactionService.fetchTripTransactions(this.trip().id),
  }));

  readonly transactions = computed<Transaction[]>(() => this.tripQuery.data() ?? []);
  readonly loading = computed(() => this.tripQuery.isPending());
  readonly error = computed(() => this.tripQuery.isError());
  readonly expandedCategory = signal<string | null>(null);
  readonly selectedTransaction = signal<Transaction | null>(null);

  readonly days = computed(() => {
    const t = this.trip();
    if (!t.startDate || !t.endDate) return 1;
    return daysInRange(t.startDate, t.endDate);
  });

  readonly perDay = computed(() => this.trip().amount / this.days());

  readonly totalSpent = computed(() => this.transactions().reduce((sum, tx) => sum + tx.amount, 0));

  /**
   * The stored total minus what the transactions add up to. Adding a transaction keeps the two
   * equal, so a gap means part of the total was entered by hand (older trips) or was edited.
   */
  readonly unitemised = computed(() => {
    if (this.loading() || this.error()) return 0;
    const gap = this.trip().amount - this.totalSpent();
    return Math.abs(gap) < 0.005 ? 0 : gap;
  });

  /** Biggest share first, the same reading order as a month's breakdown. */
  readonly categoryRows = computed<TripCategoryRow[]>(() => {
    const rowMap = new Map<string, TripCategoryRow>();

    for (const cat of TRIP_CATEGORY_NAMES) {
      rowMap.set(cat, { name: cat, amount: 0, transactions: [] });
    }

    for (const tx of this.transactions()) {
      const row = rowMap.get(tx.category);
      if (row) {
        row.amount += tx.amount;
        row.transactions.push(tx);
      } else {
        rowMap.set(tx.category, { name: tx.category, amount: tx.amount, transactions: [tx] });
      }
    }

    return [...rowMap.values()]
      .filter((r) => r.transactions.length > 0)
      .sort((a, b) => b.amount - a.amount);
  });

  constructor() {
    // Collapse the open category only when switching trips, not after an edit.
    effect(() => {
      this.trip().id;
      untracked(() => {
        this.expandedCategory.set(null);
        this.selectedTransaction.set(null);
        this.editingTrip.set(false);
      });
    });
  }

  share(row: TripCategoryRow): number {
    const total = this.totalSpent();
    return total > 0 ? row.amount / total : 0;
  }

  emoji(name: string): string | null {
    const emoji = getCategoryMeta(name).emoji;
    return emoji === '•' ? null : emoji;
  }

  formatPercent(value: number): string {
    const rounded = value.toFixed(1);
    return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
  }

  toggleCategory(name: string): void {
    this.expandedCategory.update((cur) => (cur === name ? null : name));
  }

  retry(): void {
    void this.tripQuery.refetch();
  }
}
