import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { PEOPLE } from '../../models/splitz.model';
import { Transaction } from '../../models/transaction.model';
import { compareNewestFirst } from '../../services/transaction-service';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { categoryLabel } from '../../utils/period-pace';
import { BUTTON_SECONDARY } from '../../utils/pill-styles';

const PAGE_SIZE = 10;

/**
 * Transaction rows, shared by every breakdown and by Recent. Each row opens the edit sheet.
 * "Load more" reveals already-loaded items, so it never costs a Firestore read.
 */
@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    @if (loading()) {
      <div class="space-y-2 py-2 animate-pulse" aria-label="Loading transactions">
        @for (i of [1, 2, 3]; track i) {
          <div class="h-11 rounded-lg bg-raised/70"></div>
        }
      </div>
    } @else if (error()) {
      <div role="alert" class="flex items-center justify-between gap-3 py-3">
        <p class="text-[13px] text-cherry">Couldn't load these transactions.</p>
        <button type="button" [class]="secondary + ' shrink-0'" (click)="retry.emit()">Try again</button>
      </div>
    } @else if (!sorted().length) {
      <p class="py-3 text-[13px] text-ink-3">No transactions found.</p>
    } @else {
      <ul class="divide-y divide-ink/[0.07]">
        @for (tx of visible(); track tx.id) {
          <li>
            <button
              type="button"
              (click)="selectTransaction.emit(tx)"
              class="flex w-full min-h-12 items-center justify-between gap-3 py-2.5 text-left hover:bg-ink/[0.03] cursor-pointer"
            >
              <span class="min-w-0">
                <span class="flex items-center gap-1.5 text-[14px] text-ink">
                  <span class="truncate">{{ tx.description }}</span>
                  @if (tx.isSplit) {
                    <svg
                      class="size-3.5 shrink-0 text-ink-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      role="img"
                      aria-label="Split transaction"
                    >
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
                    </svg>
                  }
                </span>
                <span class="mt-0.5 block truncate text-[12px] text-ink-3">
                  {{ tx.date | date: 'd MMM' }}
                  @if (showCategory()) {
                    · {{ label(tx.category) }}
                  }
                  @if (tx.subCategory) {
                    · {{ tx.subCategory }}
                  }
                  @if (splitNote(tx); as note) {
                    · {{ note }}
                  }
                  @if (tx.comment) {
                    · <span class="italic text-ink-2">“{{ tx.comment }}”</span>
                  }
                </span>
              </span>
              <span class="shrink-0 text-right">
                <span class="block text-[14px] font-medium text-ink tabular-nums" appSensitive="xs">
                  €{{ tx.amount | number: '1.2-2' }}
                </span>
                @if (tx.isSplit) {
                  <span class="block text-[12px] text-ink-3 tabular-nums" appSensitive="xs">
                    of €{{ tx.totalAmount ?? tx.amount | number: '1.2-2' }}
                  </span>
                }
              </span>
            </button>
          </li>
        }
      </ul>

      @if (hasMore()) {
        <button
          type="button"
          (click)="loadMore()"
          class="mt-1 w-full min-h-11 rounded-xl border border-edge text-[13px] font-medium text-ink-2 hover:border-ink-4 hover:text-ink cursor-pointer"
        >
          Load more
        </button>
      }
    }
  `,
})
export class TransactionListComponent {
  readonly transactions = input<Transaction[]>([]);
  readonly loading = input(false);
  readonly error = input(false);
  /** Show the category on each row (for mixed lists like Recent). */
  readonly showCategory = input(false);

  readonly selectTransaction = output<Transaction>();
  /** Asked to load again after an error. */
  readonly retry = output<void>();
  protected readonly secondary = BUTTON_SECONDARY;

  private readonly visibleCount = signal(PAGE_SIZE);

  readonly sorted = computed(() => [...this.transactions()].sort(compareNewestFirst));
  readonly visible = computed(() => this.sorted().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.visibleCount() < this.sorted().length);

  loadMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  label(category: string): string {
    return categoryLabel(category);
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
