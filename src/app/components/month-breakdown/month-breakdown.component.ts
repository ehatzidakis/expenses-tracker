import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Adjustment } from '../../models/adjustments.model';
import { Expense } from '../../models/expenses.model';

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
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      @for (month of monthSummaries(); track month.name) {
        <article class="space-y-3 rounded-xl border border-gray-800/60 bg-amber-50/5 px-3 py-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-medium text-sm text-gray-200">{{ month.name }}</h3>
            <span class="text-xs text-gray-400 tabular-nums">
              €{{ month.saved | number: '1.2-2' }} saved
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg bg-gray-950/50 px-2.5 py-2">
              <span class="block text-gray-500">Wage</span>
              <span class="text-gray-200 tabular-nums">€{{ month.wage | number: '1.2-2' }}</span>
            </div>
            <div class="rounded-lg bg-gray-950/50 px-2.5 py-2">
              <span class="block text-gray-500">Spend</span>
              <span class="text-gray-200 tabular-nums">€{{ month.spend | number: '1.2-2' }}</span>
            </div>
          </div>
          @if (month.adjustments.length) {
            <div class="space-y-1 border-t border-gray-800/60 pt-2">
              <span class="text-[10px] uppercase tracking-wider text-gray-500">
                One-off adjustments
              </span>
              @for (adjustment of month.adjustments; track adjustment.id) {
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="min-w-0 truncate text-gray-300">{{ adjustment.title }}</span>
                  <span
                    class="shrink-0 tabular-nums"
                    [class.text-emerald-300]="adjustment.adjType"
                    [class.text-red-300]="!adjustment.adjType"
                  >
                    {{ adjustment.adjType ? '+' : '-' }}€{{ adjustment.amount | number: '1.2-2' }}
                    <span class="text-gray-500">{{ adjustment.endDate | date: 'dd/MM/yyyy' }}</span>
                  </span>
                </div>
              }
            </div>
          }
        </article>
      } @empty {
        <p class="py-4 text-center text-xs text-gray-500">No completed months yet.</p>
      }
    </div>
  `,
})
export class MonthBreakdownComponent {
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
        const adjustmentTotal = adjustments.reduce(
          (sum, adjustment) => sum + (adjustment.adjType ? adjustment.amount : -adjustment.amount),
          0,
        );
        const wage = Number(expense.TotalWage) || 0;

        return {
          name: expense.MonthName,
          wage,
          spend,
          saved: wage - spend + adjustmentTotal,
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
