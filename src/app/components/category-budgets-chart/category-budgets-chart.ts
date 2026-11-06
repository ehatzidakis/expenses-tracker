import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseStateService } from '../../services/expense-state.service';
import { AuthService } from '../../services/auth.service';
import {
  CategoryBudgetsBarChartComponent,
  MonthlyTrendItem,
} from '../category-budgets-bar-chart/category-budgets-bar-chart';
import { CategoryBudgetsPieChartComponent } from '../category-budgets-pie-chart/category-budgets-pie-chart';

@Component({
  selector: 'app-category-budgets-chart',
  standalone: true,
  imports: [CommonModule, CategoryBudgetsBarChartComponent, CategoryBudgetsPieChartComponent],
  template: `
    <div
      class="bg-panel/60 border border-raised/80 rounded-2xl p-4 space-y-4 overflow-hidden select-none"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-ink">{{ chartHeader() }}</h3>
          <p class="text-[11px] text-ink-2 mt-0.5">{{ chartSubheader() }}</p>
        </div>

        <div class="inline-flex rounded-full border border-edge bg-ground/80 p-1">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-ember]="selectedChart() === 'bar'"
            [class.text-ground]="selectedChart() === 'bar'"
            [class.text-ink-2]="selectedChart() !== 'bar'"
            (click)="selectedChart.set('bar')"
          >
            Bar
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-ember]="selectedChart() === 'pie'"
            [class.text-ground]="selectedChart() === 'pie'"
            [class.text-ink-2]="selectedChart() !== 'pie'"
            (click)="selectedChart.set('pie')"
          >
            Pie
          </button>
        </div>
      </div>

      @if (selectedChart() === 'bar') {
        <app-category-budgets-bar-chart
          [monthlyTrends]="monthlyTrends()"
          [activeMonth]="activeMonth()"
          [maxTrendSpend]="maxTrendSpend()"
          (monthSelected)="selectMonth($event)"
        ></app-category-budgets-bar-chart>
      } @else {
        <app-category-budgets-pie-chart></app-category-budgets-pie-chart>
      }
    </div>
  `,
})
export class CategoryBudgetsChartComponent {
  readonly state = inject(ExpenseStateService);
  readonly authService = inject(AuthService);

  readonly selectedChart = signal<'bar' | 'pie'>('bar');

  readonly chartHeader = computed(() =>
    this.selectedChart() === 'bar' ? 'Monthly spend trend' : 'All-time category split',
  );

  readonly chartSubheader = computed(() =>
    this.selectedChart() === 'bar'
      ? 'Tap a month to inspect the details'
      : 'Spend vs saved across all months',
  );

  // Selected month ID for tap interaction on iOS
  readonly selectedMonthId = signal<string | null>(null);

  readonly monthlyTrends = computed<MonthlyTrendItem[]>(() => {
    const raw = this.state.processedExpenses().filter((e) => e.id !== 'ALL');
    return [...raw].map((e) => {
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

  readonly activeMonth = computed<MonthlyTrendItem | null>(() => {
    const trends = this.monthlyTrends();
    if (!trends.length) return null;

    const selectedId = this.selectedMonthId();
    if (selectedId) {
      const found = trends.find((t) => t.id === selectedId);
      if (found) return found;
    }

    return trends[0];
  });

  readonly maxTrendSpend = computed(() => {
    const trends = this.monthlyTrends();
    if (!trends.length) return 2000;

    const allValues = trends.flatMap((t) => [t.total, t.wage]);
    const maxVal = Math.max(...allValues, 1000);
    return maxVal * 1.15;
  });

  selectMonth(id: string): void {
    this.selectedMonthId.set(id);
    this.state.selectMonth(id);
    console.log('Is Kiosk --> ', this.authService.isKiosk());
    console.log('Is Admin --> ', this.authService.isAdmin());
    console.log('Current Role --> ', this.authService.currentRole());
  }
}
