import { Component, input, signal } from '@angular/core';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, TransactionGridComponent, EditTransactionComponent],
  host: { class: 'block' },
  templateUrl: './category-breakdown.component.html',
})
export class CategoryBreakdownComponent {
  categories = input.required<CategorySpend[]>();
  monthName = input<string>('');
  selectedTransaction = signal<Transaction | null>(null);

  readonly expandedCategory = signal<string | null>(null);

  protected readonly Math = Math;

  toggleCategory(name: string): void {
    this.expandedCategory.update((current) => (current === name ? null : name));
  }

  onSelectTransaction(tx: Transaction): void {
    console.log('Parent received selected transaction:', tx);
    this.selectedTransaction.set(tx);
  }

  onEditFinished(): void {
    this.selectedTransaction.set(null);
    // Optional: trigger grid refresh if needed
  }
}
