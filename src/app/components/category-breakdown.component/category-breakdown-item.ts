import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { CategorySpend, getCategoryMeta } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { CategoryBreakdownDetailsComponent } from './category-breakdown-details';
import { BreakdownRowComponent, RowTone } from '../breakdown-row/breakdown-row';
import { budgetStatus, categoryLabel } from '../../utils/period-pace';

@Component({
  selector: 'app-category-breakdown-item',
  standalone: true,
  imports: [BreakdownRowComponent, CategoryBreakdownDetailsComponent],
  host: { class: 'block' },
  template: `
    <app-breakdown-row
      [label]="label()"
      [emoji]="emoji()"
      [amount]="category().amount"
      [budget]="category().isAllTime ? null : category().budget"
      [ratio]="ratio()"
      [tone]="tone()"
      [statusText]="statusText()"
      [meta]="meta()"
      [expanded]="expanded()"
      [dimmed]="dimmed()"
      (toggle)="toggle.emit()"
    >
      @if (expanded()) {
        <app-category-breakdown-details
          [category]="category()"
          [monthName]="monthName()"
          (selectTransaction)="selectTransaction.emit($event)"
        />
      }
    </app-breakdown-row>
  `,
})
export class CategoryBreakdownItemComponent {
  private readonly decimal = new DecimalPipe('en-US');

  readonly category = input.required<CategorySpend>();
  readonly monthName = input.required<string>();
  readonly transactionCount = input(0);
  readonly expanded = input(false);
  readonly dimmed = input(false);
  /** Share of the month gone by today (1 for finished months, null when unknown). */
  readonly pace = input<number | null>(null);

  readonly toggle = output<void>();
  readonly selectTransaction = output<Transaction>();

  readonly label = computed(() => categoryLabel(this.category().name));
  readonly emoji = computed(() => getCategoryMeta(this.category().name).emoji);

  /** All-time compares the monthly average with the monthly budget. */
  private readonly compared = computed(() => {
    const c = this.category();
    return c.isAllTime ? (c.monthlyAverage ?? 0) : c.amount;
  });

  readonly ratio = computed(() => {
    const budget = this.category().budget;
    return budget ? this.compared() / budget : 0;
  });

  readonly tone = computed<RowTone>(() => {
    const c = this.category();
    if (c.isAllTime) {
      if (c.amount <= 0) return 'quiet';
      if (c.budget === null) return 'none';
      const avg = this.compared();
      if (avg > c.budget + 0.005) return 'over';
      return avg >= c.budget - 0.005 ? 'full' : 'ok';
    }
    return budgetStatus(c.amount, c.budget, this.pace());
  });

  readonly statusText = computed(() => {
    const c = this.category();
    const money = (value: number) => `€${this.decimal.transform(value, '1.2-2')}`;

    if (c.isAllTime) {
      if (c.monthlyAverage === null) return `${money(c.amount)} in total`;
      const vs = c.budget !== null ? ` vs ${money(c.budget)} budget` : '';
      return `Avg ${money(c.monthlyAverage)} a month${vs}`;
    }

    const budget = c.budget ?? 0;
    const pace = this.pace();
    switch (this.tone()) {
      case 'over':
        return `${money(c.amount - budget)} over`;
      case 'ahead':
        return `${money(c.amount - budget * (pace ?? 1))} ahead of pace`;
      case 'full':
        return 'Budget used';
      case 'ok':
        return pace === 1 ? `${money(budget - c.amount)} under` : `${money(budget - c.amount)} left`;
      case 'none':
        return 'No budget set';
      default:
        return 'Nothing spent yet';
    }
  });

  readonly meta = computed(() => {
    if (this.category().isAllTime) return 'By year';
    const n = this.transactionCount();
    return `${n} transaction${n === 1 ? '' : 's'}`;
  });
}
