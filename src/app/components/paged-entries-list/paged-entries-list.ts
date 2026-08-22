import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore/lite';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction-service';

export type EntryListMode = 'category' | 'description';

@Component({
  selector: 'app-paged-entries-list',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './paged-entries-list.html',
})
export class PagedEntriesListComponent {
  private readonly transactionService = inject(TransactionService);

  title = input.required<string>();
  mode = input<EntryListMode>('category');
  filterValue = input.required<string>();

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
          ? await this.transactionService.fetchPageByDescription(this.filterValue(), cursor)
          : await this.transactionService.fetchPageByCategory(this.filterValue(), cursor);

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
