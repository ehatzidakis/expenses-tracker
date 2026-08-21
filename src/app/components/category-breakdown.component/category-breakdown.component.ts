import { Component, input, signal } from '@angular/core';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { CATEGORY_BUDGETS, CategorySpend } from '../../services/expense-state.service';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';
import { YearlyCategorySumsComponent } from '../yearly-category-sums/yearly-category-sums';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [
    CommonModule,
    TransactionGridComponent,
    EditTransactionComponent,
    YearlyCategorySumsComponent,
  ],
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
    this.selectedTransaction.set(null);
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
