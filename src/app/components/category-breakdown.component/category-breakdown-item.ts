import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { CategorySpend, getCategoryMeta } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { CategoryBreakdownDetailsComponent } from './category-breakdown-details';
import { BreakdownRowComponent, RowTone } from '../breakdown-row/breakdown-row';
import { budgetStatus, categoryLabel } from '../../utils/period-pace';

/** 0.334 → "33%"; a sliver that would round to 0 reads "<1%". */
function percent(fraction: number): string {
  const value = Math.round(fraction * 100);
  return value === 0 && fraction > 0 ? '<1%' : `${value}%`;
}

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
  /** Adds the over/left share of the budget to the status, for the % sorts. */
  readonly showPercent = input(false);

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
    const status = budgetStatus(c.amount, c.budget, this.pace());
    // "Ahead of pace" is switched off in the UI for now: those rows read as plain "left".
    // To bring it back, return `status` unchanged (and restore the 'ahead' case in statusText).
    return status === 'ahead' ? 'ok' : status;
  });

  readonly statusText = computed(() => {
    const c = this.category();
    const money = (value: number) => `€${this.decimal.transform(value, '1.2-2')}`;

    const budget = c.budget ?? 0;
    // Under a % sort, add the share of the budget so the order reads at a glance.
    const share = (value: number) =>
      this.showPercent() && budget > 0 ? ` (${percent(value / budget)})` : '';

    if (c.isAllTime) {
      if (c.monthlyAverage === null) return `${money(c.amount)} in total`;
      const avg = `Avg ${money(c.monthlyAverage)} a month`;
      if (c.budget === null) return avg;
      // Under a % sort, swap "vs budget" for how far the average sits over or under it.
      if (this.showPercent()) {
        const gap = c.monthlyAverage - budget;
        if (this.tone() === 'over') return `${avg} · ${money(gap)} over${share(gap)}`;
        if (this.tone() === 'ok') return `${avg} · ${money(-gap)} under${share(-gap)}`;
      }
      return `${avg} vs ${money(c.budget)} budget`;
    }

    const pace = this.pace();
    switch (this.tone()) {
      case 'over':
        return `${money(c.amount - budget)} over${share(c.amount - budget)}`;
      // Switched off in the UI for now (see tone): these rows show "left" instead.
      // case 'ahead':
      //   return `${money(c.amount - budget * (pace ?? 1))} ahead of pace`;
      case 'full':
        return 'Budget used';
      case 'ok':
        return `${money(budget - c.amount)} ${pace === 1 ? 'under' : 'left'}${share(budget - c.amount)}`;
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
