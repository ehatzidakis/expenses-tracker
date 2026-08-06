import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseStateService } from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';

interface MonthlyTrendItem {
  id: string;
  monthName: string;
  shortLabel: string;
  total: number;
  wage: number;
}

@Component({
  selector: 'app-category-budgets-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-budgets-chart.html',
})
export class CategoryBudgetsChartComponent {
  readonly state = inject(ExpenseStateService);
  readonly privacyService = inject(PrivacyService);

  // Selected month ID for tap interaction on iOS
  readonly selectedMonthId = signal<string | null>(null);

  // ================= MONTH-OVER-MONTH TREND CALCULATIONS =================
  readonly monthlyTrends = computed<MonthlyTrendItem[]>(() => {
    const raw = this.state.processedExpenses().filter((e) => e.id !== 'ALL');

    // Reverse-chronological order: Current (newest) month first -> Oldest month last
    const sorted = [...raw];

    return sorted.map((e) => {
      const total =
        (Number(e.Supermarket) || 0) +
        (Number(e.Medical) || 0) +
        (Number(e.Personal) || 0) +
        (Number(e.EatingOut) || 0) +
        (Number(e.Utilities) || 0) +
        (Number(e.Takeaway) || 0) +
        (Number(e.Tickets) || 0) +
        (Number(e.Gaming) || 0) +
        (Number(e.Cats) || 0) +
        (Number(e.Travel) || 0) +
        (Number(e.Subscriptions) || 0) +
        (Number(e.Gym) || 0);

      const parts = e.MonthName.split(' ');
      const shortLabel =
        parts.length >= 2
          ? `${parts[0].substring(0, 3)} '${parts[1].slice(-2)}`
          : e.MonthName.substring(0, 3);

      return {
        id: e.id,
        monthName: e.MonthName,
        shortLabel,
        total,
        wage: Number(e.TotalWage) || 1600,
      };
    });
  });

  // Selected month object (defaults to current/newest month at index 0)
  readonly activeMonth = computed<MonthlyTrendItem | null>(() => {
    const trends = this.monthlyTrends();
    if (!trends.length) return null;

    const selectedId = this.selectedMonthId();
    if (selectedId) {
      const found = trends.find((t) => t.id === selectedId);
      if (found) return found;
    }

    // Default to the current/newest month (first item)
    return trends[0];
  });

  // Highest point in chart scale + 15% ceiling headroom
  readonly maxTrendSpend = computed(() => {
    const trends = this.monthlyTrends();
    if (!trends.length) return 2000;

    const allValues = trends.flatMap((t) => [t.total, t.wage]);
    const maxVal = Math.max(...allValues, 1000);
    return maxVal * 1.15;
  });

  selectMonth(id: string): void {
    this.selectedMonthId.set(id);
  }

  getBarHeightPercent(amount: number): number {
    const max = this.maxTrendSpend();
    if (max <= 0) return 0;
    return Math.min(Math.round((amount / max) * 100), 100);
  }

  getWageLinePercent(wage?: number): number {
    const targetWage = wage ?? this.activeMonth()?.wage ?? 1600;
    const max = this.maxTrendSpend();
    if (max <= 0) return 0;
    return Math.min(Math.round((targetWage / max) * 100), 100);
  }
}
