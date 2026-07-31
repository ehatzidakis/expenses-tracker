import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, TransactionGridComponent],
  host: { class: 'block' },
  templateUrl: './category-breakdown.component.html',
})
export class CategoryBreakdownComponent {
  categories = input.required<CategorySpend[]>();
  monthName = input<string>('');

  readonly expandedCategory = signal<string | null>(null);

  toggleCategory(name: string): void {
    this.expandedCategory.update((current) => (current === name ? null : name));
  }
}
