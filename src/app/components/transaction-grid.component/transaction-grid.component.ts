import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore/lite';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-grid',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="mt-3 pt-3 border-t border-gray-800/60 space-y-3">
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-pulse">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-12 bg-gray-800/60 rounded-xl"></div>
          }
        </div>
      } @else if (error()) {
        <div class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
          Unable to load transactions.
        </div>
      } @else if (items().length) {
        <!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"> -->
        <!-- <div class="mt-3 pt-3 border-t border-gray-800/60 space-y-2"> -->
        @for (tx of items(); track tx.id) {
          <button
            type="button"
            (click)="onItemClick(tx)"
            class="w-full text-left p-3.5 border-none bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800/80 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div class="min-w-0">
              <span class="text-xs font-medium text-gray-200 truncate flex items-center gap-1.5">
                <span class="truncate">{{ tx.description }}</span>
                @if (tx.isSplit) {
                  <span
                    aria-label="Split transaction"
                    title="Split transaction"
                    class="text-[11px] leading-none"
                    >✂️</span
                  >
                }
                @if (tx.comment) {
                  <span
                    aria-label="Transaction has a comment"
                    title="Transaction has a comment"
                    class="text-[11px] leading-none"
                    >💬</span
                  >
                }
                <!-- <span class="truncate">{{ tx.description }}</span> -->
              </span>
              <span class="text-[10px] text-gray-500 block mt-0.5">{{
                tx.date | date: 'dd/MM/yyyy'
              }}</span>
            </div>
            <span class="text-xs font-semibold text-white shrink-0 ml-2"
              >€{{ tx.amount | number: '1.2-2' }}</span
            >
          </button>
          <!-- </div> -->
        }
        <!-- </div> -->

        <div class="flex items-center justify-between pt-1">
          <button
            (click)="back()"
            [disabled]="page() === 1"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-800 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-700 transition-colors"
          >
            ← Back
          </button>
          <span class="text-[11px] text-gray-500">Page {{ page() }}</span>
          <button
            (click)="next()"
            [disabled]="!hasMore()"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-800 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-700 transition-colors"
          >
            Next →
          </button>
        </div>
      } @else {
        <div class="text-center text-xs text-gray-500 py-4">No transactions found.</div>
      }
    </div>
  `,
})
export class TransactionGridComponent {
  private transactionService = inject(TransactionService);

  monthName = input.required<string>();
  category = input.required<string>();

  selectTransaction = output<Transaction>();

  onItemClick(item: Transaction): void {
    console.log('Grid row clicked:', item);
    this.selectTransaction.emit(item);
  }

  readonly items = signal<Transaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly hasMore = signal(false);
  readonly page = signal(1);

  // cursors[i] is the "last doc" cursor to start page i+1 from; cursors[0] is always null
  private cursors: (QueryDocumentSnapshot<DocumentData> | null)[] = [null];

  constructor() {
    effect(() => {
      this.monthName();
      this.category();
      this.cursors = [null];
      this.loadPage(1);
    });
  }

  refresh(): void {
    this.loadPage(this.page());
  }

  private async loadPage(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const cursor = this.cursors[page - 1] ?? null;
      const result = await this.transactionService.fetchPage(
        this.monthName(),
        this.category(),
        cursor,
      );
      this.items.set(result.items);
      this.hasMore.set(result.hasMore);
      this.cursors[page] = result.lastDoc;
      this.page.set(page);
    } catch (err) {
      console.error('Transaction fetch error:', err);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
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
