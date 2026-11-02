import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { PEOPLE } from '../../models/splitz.model';
import { Transaction } from '../../models/transaction.model';
import { compareNewestFirst } from '../../services/transaction-service';
import { SensitiveDirective } from '../../utils/sensitive.directive';

const PAGE_SIZE = 10;

/**
 * Scrollable list of transaction cards, shared by the month and trip breakdowns.
 * It only displays the list it is given; "Load more" reveals already-loaded items, so it
 * never costs a Firestore read.
 */
@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="mt-3 pt-3 border-t border-gray-800/60">
      @if (loading()) {
        <div class="space-y-2 animate-pulse">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-12 bg-gray-800/60 rounded-xl"></div>
          }
        </div>
      } @else if (error()) {
        <div class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
          Unable to load transactions.
        </div>
      } @else if (!sorted().length) {
        <div class="text-center text-xs text-gray-500 py-4">No transactions found.</div>
      } @else {
        <div class="max-h-88 overflow-y-auto overscroll-contain space-y-2 pr-1">
          @for (tx of visible(); track tx.id) {
            <button
              type="button"
              (click)="selectTransaction.emit(tx)"
              class="w-full text-left bg-gray-800/40 border border-gray-800/80 rounded-xl px-3 py-2 hover:border-gray-700 transition-colors cursor-pointer"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 flex items-center gap-1.5 text-xs font-medium text-gray-200">
                  <span class="truncate">{{ tx.description }}</span>
                  @if (tx.isSplit) {
                    <span
                      aria-label="Split transaction"
                      title="Split transaction"
                      class="text-[11px] leading-none"
                      >✂️</span
                    >
                  }
                </span>
                <span
                  class="shrink-0 text-xs font-semibold text-white tabular-nums"
                  appSensitive="xs"
                >
                  €{{ tx.amount | number: '1.2-2' }}
                </span>
              </div>

              <div class="mt-0.5 flex items-center justify-between gap-2 text-[10px]">
                <span class="min-w-0 truncate text-gray-500">
                  {{ tx.date | date: 'dd/MM' }}
                  @if (tx.subCategory) {
                    · {{ tx.subCategory }}
                  }
                  @if (splitNote(tx); as note) {
                    · {{ note }}
                  }
                  @if (tx.comment) {
                    · <span class="italic text-gray-400">“{{ tx.comment }}”</span>
                  }
                </span>
                @if (tx.isSplit) {
                  <span class="shrink-0 text-gray-500 tabular-nums" appSensitive="xs">
                    of €{{ tx.totalAmount ?? tx.amount | number: '1.2-2' }}
                  </span>
                }
              </div>
            </button>
          }

          @if (hasMore()) {
            <button
              type="button"
              (click)="loadMore()"
              class="w-full py-2 rounded-xl text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15 hover:border-indigo-500/50 transition-colors cursor-pointer"
            >
              Load more
            </button>
          }

          <!-- Fade hinting at more cards below; only when the list overflows the box. -->
          @if (visible().length > 6) {
            <div
              class="sticky bottom-0 -mt-2 h-8 rounded-b-xl bg-linear-to-t from-gray-950/40 via-gray-950/15 to-transparent pointer-events-none"
              aria-hidden="true"
            ></div>
          }
        </div>
      }
    </div>
  `,
})
export class TransactionListComponent {
  readonly transactions = input<Transaction[]>([]);
  readonly loading = input(false);
  readonly error = input(false);

  readonly selectTransaction = output<Transaction>();

  private readonly visibleCount = signal(PAGE_SIZE);

  readonly sorted = computed(() => [...this.transactions()].sort(compareNewestFirst));
  readonly visible = computed(() => this.sorted().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.visibleCount() < this.sorted().length);

  loadMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  /** Who paid, or how many have settled when I paid. */
  splitNote(tx: Transaction): string | null {
    if (!tx.isSplit) return null;
    if (tx.paidBy !== undefined && tx.paidBy !== 'me') {
      return `paid by ${this.personName(tx.paidBy)}`;
    }
    const people = tx.splitBy?.length ?? 0;
    const settled = tx.splitPaidPersonIds?.length ?? 0;
    return people ? `${settled}/${people} settled` : null;
  }

  private personName(id: number): string {
    return PEOPLE.find((person) => person.id === id)?.name ?? `Person ${id}`;
  }
}
