import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction-service';
import { Adjustment } from '../../models/adjustments.model';
import { TRIP_CATEGORY_NAMES } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { AdjustmentCardComponent } from '../adjustment-card.component/adjustment-card.component';
import { EditAdjustmentComponent } from '../edit-adjustment.component/edit-adjustment.component';

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
      } @else if (selectedTransaction()) {
        <!-- Edit transaction overlay -->
        <app-edit-transaction
          [transaction]="selectedTransaction()!"
          [categoryOverride]="tripCategories"
          (back)="selectedTransaction.set(null)"
          (updated)="onEditFinished()"
          (deleted)="onEditFinished()"
        />
      } @else {
        <!-- Category breakdown -->
        <div
          class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 space-y-3 backdrop-blur-sm"
        >
          <h3 class="text-sm font-semibold text-gray-200">Spend by Category</h3>

          @if (categoryRows().length === 0) {
            <div class="text-center text-xs text-gray-500 py-4">No transactions yet.</div>
          }

          <div class="space-y-3.5">
            @for (row of categoryRows(); track row.name) {
              <div class="space-y-1.5">
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
                    <span class="text-gray-500">({{ row.transactions.length }})</span>
                  </div>
                  <span class="font-semibold text-white tabular-nums">
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

                <!-- Expanded transactions -->
                @if (expandedCategory() === row.name) {
                  <div class="mt-3 pt-3 border-t border-gray-800/60 space-y-2">
                    @for (tx of row.transactions; track tx.id) {
                      <button
                        type="button"
                        (click)="selectedTransaction.set(tx)"
                        class="w-full text-left bg-gray-800/40 border border-gray-800/80 rounded-xl px-3 py-2 flex items-center justify-between hover:border-gray-700 transition-colors cursor-pointer"
                      >
                        <div class="min-w-0">
                          <span class="text-xs font-medium text-gray-200 truncate block">{{
                            tx.description
                          }}</span>
                          <span class="text-[10px] text-gray-500 block mt-0.5">{{
                            tx.date | date: 'dd/MM/yyyy'
                          }}</span>
                        </div>
                        <span class="text-xs font-semibold text-white shrink-0 ml-2">
                          €{{ tx.amount | number: '1.2-2' }}
                        </span>
                      </button>
                    }
                  </div>
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

  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
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
    effect(() => {
      const tripId = this.trip().id;
      this.loadTransactions(tripId);
    });
  }

  private async loadTransactions(adjustmentId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    this.expandedCategory.set(null);
    try {
      const items = await this.transactionService.fetchAllByAdjustmentId(adjustmentId);
      this.transactions.set(items);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  toggleCategory(name: string): void {
    this.expandedCategory.update((cur) => (cur === name ? null : name));
  }

  onEditFinished(): void {
    this.selectedTransaction.set(null);
    this.loadTransactions(this.trip().id);
  }
}
