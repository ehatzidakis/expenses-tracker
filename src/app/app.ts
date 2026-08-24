import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdjustmentSelectorComponent } from './components/adjustment-selector/adjustment-selector';
import { TripBreakdownComponent } from './components/trip-breakdown/trip-breakdown';
import { ExpenseStateService } from './services/expense-state.service';
import { AdjustmentService } from './services/adjustment-service';
import { OverviewCardComponent } from './components/overview-card.component/overview-card.component';
import { HeaderComponent } from './components/header.component/header.component';
import { MonthSelectorComponent } from './components/month-selector.component/month-selector.component';
import { CategoryBreakdownComponent } from './components/category-breakdown.component/category-breakdown.component';
import { TabBarComponent } from './components/tab-bar.component/tab-bar.component';
import { AdjustmentCardComponent } from './components/adjustment-card.component/adjustment-card.component';
import { CreateTransactionComponent } from './components/create-transaction.component/create-transaction.component';
import { Adjustment } from './models/adjustments.model';
import { EditAdjustmentComponent } from './components/edit-adjustment.component/edit-adjustment.component';
import { CategoryBudgetsGrid } from './components/category-budgets-grid/category-budgets-grid';
import { CategoryBudgetsChartComponent } from './components/category-budgets-chart/category-budgets-chart';
import { UtilitySumComponent } from './components/utility-sum-component/utility-sum-component';
import { CategoryAverageComponent } from './components/category-average/category-average';
import { AuthService } from './services/auth.service';

export interface YearlyBreakdownEntry {
  year: number;
  monthlyExpenses: number;
  oneOffExpenses: number;
  monthlySaved: number;
  oneOffBonuses: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    HeaderComponent,
    OverviewCardComponent,
    MonthSelectorComponent,
    CategoryBreakdownComponent,
    TabBarComponent,
    AdjustmentCardComponent,
    EditAdjustmentComponent,
    CreateTransactionComponent,
    CategoryBudgetsGrid,
    CategoryBudgetsChartComponent,
    AdjustmentSelectorComponent,
    TripBreakdownComponent,
    UtilitySumComponent,
    CategoryAverageComponent,
  ],
  templateUrl: './app.html',
})
export class AppComponent {
  state = inject(ExpenseStateService);
  private adjustmentService = inject(AdjustmentService);
  private authService = inject(AuthService);

  readonly editingAdjustment = signal<Adjustment | null>(null);
  readonly selectedTripId = signal<string | null>(null);
  readonly email = signal('');
  readonly password = signal('');
  readonly authError = signal<string | null>(null);
  readonly isSigningIn = signal(false);
  readonly user = this.authService.user;
  readonly authReady = this.authService.authReady;
  readonly isAuthenticated = this.authService.isAuthenticated;

  adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();

  sortedAdjustments = computed(() =>
    [...(this.adjustmentsQuery.data() ?? [])].sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    ),
  );

  readonly singleAdjustments = computed(() => this.sortedAdjustments().filter((a) => !a.isTrip));

  readonly selectedTrip = computed(
    () => this.sortedAdjustments().find((a) => a.id === this.selectedTripId()) ?? null,
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

  readonly yearlyBreakdown = computed<YearlyBreakdownEntry[]>(() => {
    const byYear = new Map<number, YearlyBreakdownEntry>();

    for (const expense of this.state.processedExpenses().filter((item) => item.id !== 'ALL')) {
      const yearMatch = expense.MonthName.match(/(\d{4})$/);
      const year = yearMatch ? Number(yearMatch[1]) : null;
      if (!year) continue;

      const existing = byYear.get(year) ?? {
        year,
        monthlyExpenses: 0,
        oneOffExpenses: 0,
        monthlySaved: 0,
        oneOffBonuses: 0,
      };

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

    for (const adjustment of this.adjustmentsQuery.data() ?? []) {
      const year = adjustment.startDate.getFullYear();
      const existing = byYear.get(year) ?? {
        year,
        monthlyExpenses: 0,
        oneOffExpenses: 0,
        monthlySaved: 0,
        oneOffBonuses: 0,
      };

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

  async signIn(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();

    if (!email || !password) {
      this.authError.set('Enter both email and password.');
      return;
    }

    this.isSigningIn.set(true);
    this.authError.set(null);

    try {
      await this.authService.signIn(email, password);
      this.email.set('');
      this.password.set('');
    } catch (error) {
      console.error('Sign in failed:', error);
      this.authError.set(
        'Unable to sign in. Check your email and password, or enable Email/Password auth in Firebase.',
      );
    } finally {
      this.isSigningIn.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }
}
