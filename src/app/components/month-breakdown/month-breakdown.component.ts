import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Adjustment } from '../../models/adjustments.model';
import { Expense } from '../../models/expenses.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';

interface MonthSummary {
  name: string;
  wage: number;
  spend: number;
  saved: number;
  adjustments: Adjustment[];
}

@Component({
  selector: 'app-month-breakdown',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  template: `
    <ul class="divide-y divide-ink/10 border-y border-ink/10">
      @for (month of monthSummaries(); track month.name) {
        <li class="py-3">
          <div class="flex items-baseline justify-between gap-3">
            <h3 class="text-[15px] font-medium text-ink">{{ month.name }}</h3>
            <span
              class="saved-amount shrink-0 text-[14px] font-medium tabular-nums"
              [class.text-avocado-ink]="month.saved >= 0"
              [class.text-cherry]="month.saved < 0"
              appSensitive="xs"
            >
              {{ month.saved < 0 ? '−' : '' }}€{{ abs(month.saved) | number: '1.2-2' }} saved
            </span>
          </div>
          <p class="mt-0.5 text-[12px] text-ink-3 tabular-nums" appSensitive="xs">
            Spent €{{ month.spend | number: '1.2-2' }} · Wage €{{ month.wage | number: '1.2-2' }}
          </p>
          @if (month.adjustments.length) {
            <ul class="mt-1.5 space-y-0.5">
              @for (adjustment of month.adjustments; track adjustment.id) {
                <li class="flex items-baseline justify-between gap-2 text-[12px]">
                  <span class="min-w-0 truncate text-ink-2">
                    {{ adjustment.title }}
                    <span class="text-ink-3">· {{ adjustment.endDate | date: 'd MMM' }}</span>
                  </span>
                  <span
                    class="shrink-0 tabular-nums"
                    [class]="adjustment.adjType ? 'text-avocado-ink' : 'text-ink-2'"
                    appSensitive="xs"
                  >
                    {{ adjustment.adjType ? '+' : '−' }}€{{ adjustment.amount | number: '1.2-2' }}
                  </span>
                </li>
              }
            </ul>
          }
        </li>
      } @empty {
        <li class="py-6 text-[13px] text-ink-3">No completed months yet.</li>
      }
    </ul>
  `,
})
export class MonthBreakdownComponent {
  abs(value: number): number {
    return Math.abs(value);
  }

  private static readonly monthIndexes: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  readonly months = input<Expense[]>([]);
  readonly adjustments = input<Adjustment[]>([]);

  readonly monthSummaries = computed<MonthSummary[]>(() => {
    const currentMonth = new Date();
    const currentMonthKey = this.monthKeyFromDate(currentMonth);

    return this.months()
      .filter((expense) => this.monthKey(expense.MonthName) !== currentMonthKey)
      .sort((a, b) => this.monthTimestamp(b.MonthName) - this.monthTimestamp(a.MonthName))
      .map((expense) => {
        const spend = Object.entries(expense).reduce((sum, [key, value]) => {
          return key === 'id' || key === 'MonthName' || key === 'TotalWage'
            ? sum
            : sum + (Number(value) || 0);
        }, 0);
        const adjustments = this.adjustments().filter(
          (adjustment) =>
            this.monthKeyFromDate(adjustment.endDate) === this.monthKey(expense.MonthName),
        );
        const wage = Number(expense.TotalWage) || 0;

        return {
          name: expense.MonthName,
          wage,
          spend,
          saved: wage - spend,
          adjustments,
        };
      });
  });

  private monthTimestamp(monthName: string): number {
    const [month, year] = monthName.split(' ');
    return new Date(Number(year), MonthBreakdownComponent.monthIndexes[month] ?? 0, 1).getTime();
  }

  private monthKey(monthName: string): string {
    return this.monthKeyFromDate(new Date(this.monthTimestamp(monthName)));
  }

  private monthKeyFromDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }
}
