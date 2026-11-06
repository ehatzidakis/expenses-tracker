import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore/lite';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction-service';
import { SensitiveDirective } from '../../utils/sensitive.directive';

export type EntryListMode = 'category' | 'description';

@Component({
  selector: 'app-paged-entries-list',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="mt-3 pt-3 border-t border-raised/60 space-y-3">
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-pulse">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-12 bg-raised/60 rounded-xl"></div>
          }
        </div>
      } @else if (error()) {
        <div class="p-3 bg-cherry-deep/40 border border-cherry-deep/60 text-cherry rounded-xl text-xs">
          Unable to load entries.
        </div>
      } @else if (items().length) {
        @for (entry of items(); track entry.id) {
          <button
            type="button"
            (click)="onItemClick(entry)"
            class="w-full text-left p-3.5 border-none bg-panel/60 hover:bg-raised/80 border border-raised/80 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div class="min-w-0">
              <span class="text-xs font-medium text-ink truncate flex items-center gap-1.5">
                <span class="truncate">{{ entry.description }}</span>
                @if (entry.isSplit) {
                  <span
                    aria-label="Split transaction"
                    title="Split transaction"
                    class="text-[11px] leading-none"
                    >✂️</span
                  >
                }
                @if (entry.comment) {
                  <span
                    aria-label="Transaction has a comment"
                    title="Transaction has a comment"
                    class="text-[11px] leading-none"
                    >💬</span
                  >
                }
              </span>
              <span class="text-[11px] text-ink-3 block mt-0.5">
                {{ entry.date | date: 'dd/MM/yyyy' }}
              </span>
            </div>
            <span class="text-xs font-semibold text-ink shrink-0 ml-2 tabular-nums" appSensitive>
              €{{ entry.amount | number: '1.2-2' }}
            </span>
          </button>
        }

        <div class="flex items-center justify-between pt-1 gap-2">
          <button
            type="button"
            (click)="toggleSortByAmount()"
            class="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-raised text-ink-2 hover:border-edge transition-colors"
          >
            {{ sortByAmount() ? 'Sort: high → low' : 'Sort: newest' }}
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="back()"
              [disabled]="page() === 1"
              class="px-3 py-1.5 rounded-lg text-xs font-medium border border-raised text-ink-2 disabled:opacity-30 disabled:cursor-not-allowed hover:border-edge transition-colors"
            >
              ← Back
            </button>
            <span class="text-[11px] text-ink-3">Page {{ page() }}</span>
            <button
              type="button"
              (click)="next()"
              [disabled]="!hasMore()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium border border-raised text-ink-2 disabled:opacity-30 disabled:cursor-not-allowed hover:border-edge transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      } @else {
        <div class="text-center text-xs text-ink-3 py-4">No entries found.</div>
      }
    </div>
  `,
})
export class PagedEntriesListComponent {
  private readonly transactionService = inject(TransactionService);

  title = input.required<string>();
  mode = input<EntryListMode>('category');
  filterValue = input.required<string>();
  subCategoryId = input<number | null>(null);
  readonly sortByAmount = signal(false);

  selectEntry = output<Transaction>();

  readonly items = signal<Transaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly hasMore = signal(false);
  readonly page = signal(1);

  private cursors: (QueryDocumentSnapshot<DocumentData> | null)[] = [null];

  constructor() {
    effect(() => {
      this.title();
      this.mode();
      this.filterValue();
      this.subCategoryId();
      this.sortByAmount();
      this.cursors = [null];
      this.loadPage(1);
    });
  }

  onItemClick(item: Transaction): void {
    this.selectEntry.emit(item);
  }

  private async loadPage(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set(false);

    try {
      const cursor = this.cursors[page - 1] ?? null;
      const result =
        this.mode() === 'description'
          ? await this.transactionService.fetchPageByDescription(
              this.filterValue(),
              cursor,
              this.sortByAmount(),
            )
          : await this.transactionService.fetchPageByCategory(
              this.filterValue(),
              cursor,
              this.sortByAmount(),
              this.subCategoryId(),
            );

      this.items.set(result.items);
      this.hasMore.set(result.hasMore);
      this.cursors[page] = result.lastDoc;
      this.page.set(page);
    } catch (err) {
      console.error('Entry list fetch error:', err);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSortByAmount(): void {
    this.sortByAmount.set(!this.sortByAmount());
  }

  next(): void {
    if (this.hasMore()) {
      this.loadPage(this.page() + 1);
    }
  }

  back(): void {
    if (this.page() > 1) {
      this.loadPage(this.page() - 1);
    }
  }
}
