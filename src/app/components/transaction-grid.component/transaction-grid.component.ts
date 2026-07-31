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
  templateUrl: './transaction-grid.component.html',
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
