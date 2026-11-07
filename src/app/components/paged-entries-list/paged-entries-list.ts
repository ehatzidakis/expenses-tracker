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
    <div class="mt-1 flex flex-col gap-3">
      @if (loading()) {
        <ul class="animate-pulse divide-y divide-ink/10" aria-label="Loading entries">
          @for (i of [1, 2, 3, 4]; track i) {
            <li class="py-3"><span class="block h-4 w-40 rounded bg-raised"></span></li>
          }
        </ul>
      } @else if (error()) {
        <p role="alert" class="rounded-xl border border-cherry/30 bg-cherry-deep/60 px-3.5 py-3 text-[13px] text-cherry">
          Couldn't load these entries. Check your connection and try again.
        </p>
      } @else if (items().length) {
        <ul class="divide-y divide-ink/10 border-y border-ink/10">
          @for (entry of items(); track entry.id) {
            <li>
              <button
                type="button"
                class="flex min-h-12 w-full items-center justify-between gap-3 py-2.5 text-left cursor-pointer"
                (click)="onItemClick(entry)"
              >
                <span class="min-w-0">
                  <span class="flex items-center gap-1.5 text-[14px] text-ink">
                    <span class="truncate">{{ entry.description }}</span>
                    @if (entry.isSplit) {
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
                    @if (entry.comment) {
                      <svg
                        class="size-3.5 shrink-0 text-ink-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        role="img"
                        aria-label="Has comment"
                      >
                        <path d="M4 5h16v11H9l-5 4z" />
                      </svg>
                    }
                  </span>
                  <span class="mt-0.5 block text-[12px] text-ink-3">{{ entry.date | date: 'd MMM yyyy' }}</span>
                </span>
                <span class="shrink-0 text-[13px] font-medium text-ink tabular-nums" appSensitive="xs">
                  €{{ entry.amount | number: '1.2-2' }}
                </span>
              </button>
            </li>
          }
        </ul>

        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            class="min-h-11 rounded-xl border border-edge px-4 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink cursor-pointer"
            (click)="toggleSortByAmount()"
          >
            {{ sortByAmount() ? 'Highest first' : 'Newest first' }}
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              class="flex size-11 items-center justify-center rounded-xl border border-edge text-ink-2 transition-colors hover:border-ink-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              [disabled]="page() === 1"
              (click)="back()"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                />
              </svg>
            </button>
            <span class="min-w-14 text-center text-[12px] text-ink-3">Page {{ page() }}</span>
            <button
              type="button"
              aria-label="Next page"
              class="flex size-11 items-center justify-center rounded-xl border border-edge text-ink-2 transition-colors hover:border-ink-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              [disabled]="!hasMore()"
              (click)="next()"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                />
              </svg>
            </button>
          </div>
        </div>
      } @else {
        <p class="py-4 text-[13px] text-ink-3">No entries found.</p>
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
