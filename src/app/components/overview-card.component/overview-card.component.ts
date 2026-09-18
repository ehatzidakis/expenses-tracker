import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';
import { OverviewCardSavedColumnComponent } from './overview-card-saved-column.component';
import { OverviewCardSpendColumnComponent } from './overview-card-spend-column.component';
import { YearlyBreakdownEntry } from './overview-card.models';

export type { YearlyBreakdownEntry } from './overview-card.models';

@Component({
  selector: 'app-overview-card',
  standalone: true,
  imports: [CommonModule, OverviewCardSavedColumnComponent, OverviewCardSpendColumnComponent],
  host: { class: 'block' },
  template: `
    <section
      class="bg-linear-to-br from-gray-900 via-gray-900 to-indigo-950/50 border border-gray-800 rounded-2xl p-5 shadow-xl transition-all duration-200"
      [class.cursor-pointer]="hasBreakdown()"
      (click)="toggleExpanded()"
    >
      @if (dateRangeInfo(); as info) {
        <span class="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-4">
          @if (info.first === info.last) {
            Sum for <span class="text-gray-100 font-semibold">{{ info.count }}</span> month:
            <span class="text-gray-100 font-semibold">{{ info.first }}</span>
          } @else {
            Sum for <span class="text-gray-100 font-semibold">{{ info.count }}</span> months:
            <span class="text-gray-100 font-semibold">{{ info.first }}</span> to
            <span class="text-gray-100 font-semibold">{{ info.last }}</span>
          }
        </span>
      }

      <div class="grid items-start justify-between grid-cols-2 gap-6">
        <app-overview-card-spend-column
          [totalSpend]="totalSpend()"
          [hasBreakdown]="hasBreakdown()"
          [expanded]="expanded()"
          [monthlyExpenses]="monthlyExpenses()"
          [oneOffExpenses]="oneOffExpenses()"
          [yearlyBreakdown]="yearlyBreakdown()"
        />
        <app-overview-card-saved-column
          [totalSaved]="computedTotalSaved()"
          [hasBreakdown]="hasBreakdown()"
          [expanded]="expanded()"
          [monthlySaved]="monthlySaved()"
          [oneOffBonuses]="oneOffBonuses()"
          [yearlyBreakdown]="yearlyBreakdown()"
        />
      </div>

      @if (!hasBreakdown() && monthCountdownLabel()) {
        <div class="mt-3 text-center">
          <span class="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            {{ monthCountdownLabel() }}
          </span>
        </div>
      }

      @if (hasBreakdown()) {
        <div class="flex justify-center mt-3 pt-2 border-t border-gray-800/60">
          <svg
            class="w-4 h-4 text-gray-500 transition-transform duration-400"
            [class.rotate-180]="expanded()"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      }
    </section>
  `,
})
export class OverviewCardComponent {
  totalSpend = input.required<number>();
  totalWage = input<number>(0);
  totalSaved = input<number | null>(null);
  monthName = input<string>('');
  dateRangeInfo = input<{ count: number; first: string; last: string } | null>(null);
  topCategory = input<CategorySpend | null>(null);

  monthlyExpenses = input<number | null>(null);
  oneOffExpenses = input<number | null>(null);
  monthlySaved = input<number | null>(null);
  oneOffBonuses = input<number | null>(null);
  yearlyBreakdown = input<YearlyBreakdownEntry[]>([]);

  computedTotalSaved = computed(() => this.totalSaved() ?? this.totalWage() - this.totalSpend());

  // Breakdown rows only apply when the parent supplies the monthly/one-off split (SumUp view).
  hasBreakdown = computed(
    () => this.monthlyExpenses() !== null || this.yearlyBreakdown().length > 0,
  );

  isCurrentMonthView = computed(() => {
    const monthName = this.monthName().trim();
    if (!monthName) return false;

    const [monthLabel, yearLabel] = monthName.split(/\s+/);
    if (!monthLabel || !yearLabel) return false;

    const monthIndex = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ].findIndex((month) => month.toLowerCase() === monthLabel.toLowerCase());

    if (monthIndex === -1) return false;

    const selectedMonth = new Date(Number(yearLabel), monthIndex, 1);
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return (
      selectedMonth.getFullYear() === currentMonth.getFullYear() &&
      selectedMonth.getMonth() === currentMonth.getMonth()
    );
  });

  daysLeftInMonth = computed(() => {
    if (!this.isCurrentMonthView()) return 0;

    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDayOfMonth - today.getDate() + 1);
  });

  monthCountdownLabel = computed(() => {
    const remainingDays = this.daysLeftInMonth();
    if (!this.isCurrentMonthView()) return '';
    return `${remainingDays} day${remainingDays === 1 ? '' : 's'} left in this month`;
  });

  expanded = signal(false);

  toggleExpanded(): void {
    if (this.hasBreakdown()) {
      this.expanded.update((v) => !v);
    }
  }
}
