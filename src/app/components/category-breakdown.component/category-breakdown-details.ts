import { Component, input, output, signal } from '@angular/core';
import { CategorySpend } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';
import { YearlyCategorySumsComponent } from '../yearly-category-sums/yearly-category-sums';

@Component({
  selector: 'app-category-breakdown-details',
  standalone: true,
  imports: [EditTransactionComponent, TransactionGridComponent, YearlyCategorySumsComponent],
  host: { class: 'block' },
  template: `
    @defer (on immediate) {
      @if (category().isAllTime) {
        <app-yearly-category-sums [category]="category().name" />
      } @else if (selectedTransaction(); as transaction) {
        <app-edit-transaction
          [transaction]="transaction"
          (back)="selectedTransaction.set(null)"
          (updated)="finishEdit()"
          (deleted)="finishEdit()"
        />
      } @else {
        <app-transaction-grid
          [monthName]="monthName()"
          [category]="category().name"
          (selectTransaction)="selectedTransaction.set($event)"
        />
      }
    } @loading {
      <div class="mt-3 h-24 bg-gray-800/40 rounded-xl animate-pulse"></div>
    }
  `,
})
export class CategoryBreakdownDetailsComponent {
  readonly category = input.required<CategorySpend>();
  readonly monthName = input.required<string>();

  readonly changed = output<void>();
  readonly selectedTransaction = signal<Transaction | null>(null);

  finishEdit(): void {
    this.selectedTransaction.set(null);
    this.changed.emit();
  }
}
