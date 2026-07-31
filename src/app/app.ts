import { Component, computed, inject } from '@angular/core';
import { ExpenseStateService } from './services/expense-state.service';
import { AdjustmentService } from './services/adjustment-service';
import { OverviewCardComponent } from './components/overview-card.component/overview-card.component';
import { HeaderComponent } from './components/header.component/header.component';
import { MonthSelectorComponent } from './components/month-selector.component/month-selector.component';
import { CategoryBreakdownComponent } from './components/category-breakdown.component/category-breakdown.component';
import { TabBarComponent } from './components/tab-bar.component/tab-bar.component';
import { AdjustmentCardComponent } from './components/adjustment-card.component/adjustment-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    OverviewCardComponent,
    MonthSelectorComponent,
    CategoryBreakdownComponent,
    TabBarComponent,
    AdjustmentCardComponent,
  ],
  templateUrl: './app.html',
})
export class AppComponent {
  state = inject(ExpenseStateService);
  private adjustmentService = inject(AdjustmentService);

  adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();

  sortedAdjustments = computed(() =>
    [...(this.adjustmentsQuery.data() ?? [])].sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    ),
  );

  readonly oneOffExpenses = computed(() =>
    this.sortedAdjustments()
      .filter((a) => !a.adjType)
      .reduce((sum, a) => sum + a.amount, 0),
  );

  readonly oneOffBonuses = computed(() =>
    this.sortedAdjustments()
      .filter((a) => a.adjType)
      .reduce((sum, a) => sum + a.amount, 0),
  );

  readonly monthlySaved = computed(
    () => this.state.selectedTotalWage() - this.state.totalMonthlySpend(),
  );

  // Total incoming (wage + one-off bonuses) minus total outgoing (monthly + one-off expenses)
  readonly totalOutgoing = computed(() => this.state.totalMonthlySpend() + this.oneOffExpenses());
  readonly totalIncoming = computed(() => this.state.selectedTotalWage() + this.oneOffBonuses());
  readonly totalSaved = computed(() => this.totalIncoming() - this.totalOutgoing());
}
