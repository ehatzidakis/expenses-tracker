import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';

export interface YearlyBreakdownEntry {
  year: number;
  monthlyExpenses: number;
  oneOffExpenses: number;
  monthlySaved: number;
  oneOffBonuses: number;
}

@Component({
  selector: 'app-overview-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './overview-card.component.html',
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

  readonly privacyService = inject(PrivacyService);

  toggleExpanded(): void {
    if (this.hasBreakdown()) {
      this.expanded.update((v) => !v);
    }
  }
}
