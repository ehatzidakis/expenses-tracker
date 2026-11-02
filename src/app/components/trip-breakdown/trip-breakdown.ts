import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { TransactionService, tripTransactionsKey } from '../../services/transaction-service';
import { Adjustment } from '../../models/adjustments.model';
import { TRIP_CATEGORY_NAMES } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { AdjustmentCardComponent } from '../adjustment-card.component/adjustment-card.component';
import { EditAdjustmentComponent } from '../edit-adjustment.component/edit-adjustment.component';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { TransactionListComponent } from '../transaction-list/transaction-list';

interface TripCategoryRow {
  name: string;
  amount: number;
  transactions: Transaction[];
}

@Component({
  selector: 'app-trip-breakdown',
  standalone: true,
  imports: [
    CommonModule,
    EditTransactionComponent,
    AdjustmentCardComponent,
    EditAdjustmentComponent,
    SensitiveDirective,
    TransactionListComponent,
  ],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <!-- Trip header card -->
      <app-adjustment-card
        [adjustment]="trip()"
        (cardClick)="editingAdjustment.set(trip())"
      ></app-adjustment-card>
      @if (editingAdjustment(); as selectedAdj) {
        <!-- EDIT VIEW -->
        <app-edit-adjustment
          [adjustment]="selectedAdj"
          (back)="editingAdjustment.set(null)"
          (updated)="editingAdjustment.set(null)"
          (deleted)="editingAdjustment.set(null)"
        />
      }

      <!-- Loading / error states -->
      @if (loading()) {
        <div class="flex flex-col gap-3 animate-pulse">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-14 bg-gray-900/60 rounded-2xl"></div>
          }
        </div>
      } @else if (error()) {
        <div class="p-4 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-sm">
          Unable to load trip transactions.
        </div>
      } @else if (selectedTransaction(); as tx) {
        <!-- Edit transaction overlay -->
        <app-edit-transaction
          [transaction]="tx"
          [categoryOverride]="tripCategories"
          (back)="selectedTransaction.set(null)"
          (updated)="selectedTransaction.set(null)"
          (deleted)="selectedTransaction.set(null)"
        />
      } @else {
        <!-- Category breakdown -->
        <div
          class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-2 space-y-3 backdrop-blur-sm"
        >
          <!-- <h3 class="text-sm font-semibold text-gray-200">Trip Budget</h3> -->

          @if (categoryRows().length === 0) {
            <div class="text-center text-xs text-gray-500 py-4">No transactions yet.</div>
          }

          <div class="space-y-3.5">
            @for (row of categoryRows(); track row.name) {
              <div class="space-y-1.5 border border-gray-800/80 rounded-2xl bg-gray-950/20 p-3">
                <!-- Category header row -->
                <div
                  class="flex items-center justify-between text-xs py-0.5 cursor-pointer"
                  (click)="toggleCategory(row.name)"
                >
                  <div class="flex items-center gap-2">
                    <!-- <span
                      class="text-[10px] transition-transform duration-150"
                      [class.rotate-90]="expandedCategory() === row.name"
                      >▶</span
                    > -->
                    <span class="font-medium text-gray-300">{{ row.name }}</span>
                    <span class="text-gray-400 tabular-nums font-medium">
                      ({{
                        formatPercent(totalSpent() > 0 ? (row.amount / totalSpent()) * 100 : 0)
                      }}%)
                    </span>
                  </div>
                  <span class="font-semibold text-white tabular-nums" appSensitive>
                    €{{ row.amount | number: '1.2-2' }}
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full bg-linear-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                    [style.width.%]="totalSpent() > 0 ? (row.amount / totalSpent()) * 100 : 0"
                  ></div>
                </div>

                <div class="text-[10px] text-gray-500 pt-1">
                  {{ row.transactions.length }} transaction{{
                    row.transactions.length !== 1 ? 's' : ''
                  }}
                </div>

                <!-- Expanded transactions -->
                @if (expandedCategory() === row.name) {
                  <app-transaction-list
                    [transactions]="row.transactions"
                    (selectTransaction)="selectedTransaction.set($event)"
                  />
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TripBreakdownComponent {
  private transactionService = inject(TransactionService);

  readonly editingAdjustment = signal<Adjustment | null>(null);

  trip = input.required<Adjustment>();

  refreshed = output<void>();

  readonly tripCategories = TRIP_CATEGORY_NAMES;

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

  readonly isSameDay = computed(() => {
    const t = this.trip();
    if (!t.startDate || !t.endDate) return true;
    return t.startDate.toDateString() === t.endDate.toDateString();
  });

  readonly totalSpent = computed(() => this.transactions().reduce((sum, tx) => sum + tx.amount, 0));

  readonly categoryRows = computed<TripCategoryRow[]>(() => {
    const txs = this.transactions();
    const rowMap = new Map<string, TripCategoryRow>();

    for (const cat of TRIP_CATEGORY_NAMES) {
      rowMap.set(cat, { name: cat, amount: 0, transactions: [] });
    }

    for (const tx of txs) {
      const row = rowMap.get(tx.category);
      if (row) {
        row.amount += tx.amount;
        row.transactions.push(tx);
      } else {
        rowMap.set(tx.category, { name: tx.category, amount: tx.amount, transactions: [tx] });
      }
    }

    return [...rowMap.values()].filter((r) => r.transactions.length > 0);
  });

  constructor() {
    // Collapse the open category only when switching trips, not after an edit.
    effect(() => {
      this.trip().id;
      untracked(() => {
        this.expandedCategory.set(null);
        this.selectedTransaction.set(null);
      });
    });
  }

  formatPercent(value: number): string {
    const rounded = value.toFixed(1);
    return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
  }

  toggleCategory(name: string): void {
    this.expandedCategory.update((cur) => (cur === name ? null : name));
  }
}
