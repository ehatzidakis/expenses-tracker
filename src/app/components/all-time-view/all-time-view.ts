import { Component, computed, inject } from '@angular/core';
import { ExpenseStateService } from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { OverviewCardComponent } from '../overview-card.component/overview-card.component';
import { YearlyBreakdownEntry } from '../overview-card.component/overview-card.models';
import { CategoryBreakdownComponent } from '../category-breakdown.component/category-breakdown.component';

/**
 * Budget › All time: saved overall, spent in total and the breakdown by category or month,
 * across every month and one-off on record.
 */
@Component({
  selector: 'app-all-time-view',
  standalone: true,
  imports: [OverviewCardComponent, CategoryBreakdownComponent],
  host: { class: 'flex flex-col gap-5' },
  template: `
    @if (state.expensesQuery.isPending()) {
      <div class="flex flex-col gap-5 animate-pulse" aria-label="Loading">
        <div class="h-48 rounded-2xl bg-panel"></div>
        <div class="h-64 rounded-xl bg-panel/60"></div>
      </div>
    } @else if (state.expensesQuery.isError()) {
      <div role="alert" class="flex flex-col items-start gap-3 border-y border-ink/10 py-6">
        <p class="text-[15px] text-ink">Couldn't load your months.</p>
        <p class="text-[13px] text-ink-3">Check your connection and try again.</p>
        <button
          type="button"
          class="min-h-11 rounded-xl border border-edge px-4 text-[14px] font-medium text-ink hover:border-ink-4 cursor-pointer"
          (click)="state.expensesQuery.refetch()"
        >
          Try again
        </button>
      </div>
    } @else if (state.selectedExpense()) {
      <app-overview-card
        [totalSpend]="totalOutgoing()"
        [totalSaved]="totalSaved()"
        [monthlyExpenses]="state.totalMonthlySpend()"
        [oneOffExpenses]="oneOffExpenses()"
        [monthlySaved]="monthlySaved()"
        [oneOffBonuses]="oneOffBonuses()"
        [yearlyBreakdown]="yearlyBreakdown()"
        [dateRangeInfo]="state.dateRangeInfo()"
      />

      <app-category-breakdown
        [categories]="state.allTimeCategoryBreakdown()"
        [months]="state.expensesQuery.data() ?? []"
        [adjustments]="adjustmentsQuery.data() ?? []"
      />
    }
  `,
})
export class AllTimeViewComponent {
  readonly state = inject(ExpenseStateService);
  private readonly adjustmentService = inject(AdjustmentService);

  readonly adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();

  private readonly adjustments = computed(() => this.adjustmentsQuery.data() ?? []);

  readonly oneOffExpenses = computed(() =>
    this.adjustments()
      .filter((a) => !a.adjType)
      .reduce((sum, a) => sum + a.amount, 0),
  );

  readonly oneOffBonuses = computed(() =>
    this.adjustments()
      .filter((a) => a.adjType)
      .reduce((sum, a) => sum + a.amount, 0),
  );

  readonly monthlySaved = computed(
    () => this.state.selectedTotalWage() - this.state.totalMonthlySpend(),
  );

  readonly yearlyBreakdown = computed<YearlyBreakdownEntry[]>(() => {
    const byYear = new Map<number, YearlyBreakdownEntry>();
    const entry = (year: number): YearlyBreakdownEntry =>
      byYear.get(year) ?? {
        year,
        monthlyExpenses: 0,
        oneOffExpenses: 0,
        monthlySaved: 0,
        oneOffBonuses: 0,
      };

    for (const expense of this.state.processedExpenses().filter((item) => item.id !== 'ALL')) {
      const yearMatch = expense.MonthName.match(/(\d{4})$/);
      const year = yearMatch ? Number(yearMatch[1]) : null;
      if (!year) continue;

      const existing = entry(year);
      const monthlySpend = Object.entries(expense).reduce((sum, [key, value]) => {
        if (key === 'id' || key === 'MonthName' || key === 'TotalWage') {
          return sum;
        }
        return sum + (Number(value) || 0);
      }, 0);

      const wage = Number(expense.TotalWage) || 0;

      existing.monthlyExpenses += monthlySpend;
      existing.monthlySaved += wage - monthlySpend;
      byYear.set(year, existing);
    }

    for (const adjustment of this.adjustments()) {
      const year = adjustment.startDate.getFullYear();
      const existing = entry(year);

      if (adjustment.adjType) {
        existing.oneOffBonuses += adjustment.amount;
      } else {
        existing.oneOffExpenses += adjustment.amount;
      }

      byYear.set(year, existing);
    }

    return [...byYear.values()].sort((a, b) => a.year - b.year);
  });

  // Total incoming (wage + one-off bonuses) minus total outgoing (monthly + one-off expenses)
  readonly totalOutgoing = computed(() => this.state.totalMonthlySpend() + this.oneOffExpenses());
  readonly totalIncoming = computed(() => this.state.selectedTotalWage() + this.oneOffBonuses());
  readonly totalSaved = computed(() => this.totalIncoming() - this.totalOutgoing());
}
