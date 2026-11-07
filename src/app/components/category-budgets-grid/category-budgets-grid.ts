import { Component, effect, inject, OnInit } from '@angular/core';
import {
  CATEGORY_BUDGETS,
  DEFAULT_TOTAL_WAGE,
  ExpenseStateService,
} from '../../services/expense-state.service';
import { BudgetSettingsService } from '../../services/budget-settings.service';
import { BudgetCardItem, CategoryBudgetCardsComponent } from './category-budget-cards';
import { CategoryBudgetEditControlsComponent } from './category-budget-edit-controls';
import { CategoryBudgetSummaryComponent } from './category-budget-summary';
import { PrivacyService } from '../../services/privacy.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-budgets-grid',
  standalone: true,
  imports: [
    FormsModule,
    CategoryBudgetCardsComponent,
    CategoryBudgetEditControlsComponent,
    CategoryBudgetSummaryComponent,
  ],
  template: `
    <div class="flex flex-col gap-4 select-none">
      <app-category-budget-summary [wage]="wage" [totalBudget]="totalBudget" [projectedSave]="projectedSave" />

      @if (!isEditing && !privacyService.isPrivacyMode()) {
        <button
          type="button"
          class="min-h-11 self-start rounded-xl border border-edge px-4 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink cursor-pointer"
          (click)="startEditing()"
        >
          Edit budgets and wage
        </button>
      }

      @if (isEditing) {
        <div class="flex items-center justify-between gap-3">
          <label for="budget-wage" class="text-[15px] font-medium text-ink">Monthly wage</label>
          <span
            class="flex min-h-12 w-32 items-center gap-1 rounded-xl border border-edge bg-panel px-3 transition-colors focus-within:border-ember"
          >
            <span class="text-ink-3" aria-hidden="true">€</span>
            <input
              id="budget-wage"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              pattern="[0-9]*"
              class="w-full bg-transparent text-right text-ink tabular-nums focus-visible:outline-none"
              [ngModel]="draftWage"
              (ngModelChange)="setDraftWage($event)"
            />
          </span>
        </div>
      }

      <app-category-budget-cards
        [budgets]="budgets"
        [isEditing]="isEditing"
        [draftBudgets]="draftBudgets"
        (budgetChange)="updateDraftBudget($event.category, $event.value)"
      />

      @if (isEditing) {
        <!-- Pinned just above the tab bar while the budgets scroll past -->
        <app-category-budget-edit-controls
          class="sticky bottom-[calc(max(calc(env(safe-area-inset-bottom)-16px),8px)+51px)] -mx-4 block border-t border-ink/10 bg-ground px-4 py-3"
          [isEditing]="isEditing"
          [draftWage]="draftWage"
          (wageChange)="setDraftWage($event)"
          (cancel)="cancelEditing()"
          (save)="saveBudgetSettings()"
        />
      }
    </div>
  `,
})
export class CategoryBudgetsGrid implements OnInit {
  private readonly expenseState = inject(ExpenseStateService);
  private readonly budgetSettingsService = inject(BudgetSettingsService);
  readonly privacyService = inject(PrivacyService);

  budgets: BudgetCardItem[] = [];
  totalBudget = 0;
  projectedSave = DEFAULT_TOTAL_WAGE;
  wage = DEFAULT_TOTAL_WAGE;
  isEditing = false;
  draftBudgets: Record<string, number> = Object.fromEntries(
    Object.entries(CATEGORY_BUDGETS).map(([category, value]) => [category, Number(value ?? 0)]),
  );
  draftWage = DEFAULT_TOTAL_WAGE;

  constructor() {
    effect(() => {
      const settings = this.budgetSettingsService.settings();
      this.syncDisplayState(settings.categoryBudgets, settings.defaultTotalWage);
    });

    // Edit mode shows the wage and budgets in plain inputs, so close it when privacy turns on.
    effect(() => {
      if (this.privacyService.isPrivacyMode() && this.isEditing) this.cancelEditing();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.budgetSettingsService.loadSettings();
    this.syncDisplayState(settings.categoryBudgets, settings.defaultTotalWage);
    this.draftBudgets = { ...settings.categoryBudgets };
    this.draftWage = settings.defaultTotalWage;
  }

  private syncDisplayState(categoryBudgets: Record<string, number>, totalWage: number): void {
    const averageByCategory = new Map(
      this.expenseState.allTimeCategoryBreakdown().map((item) => [item.name, item.monthlyAverage]),
    );
    const nextBudgets = Object.entries(categoryBudgets).map(([category, budget]) => ({
      category,
      budget: Number(budget ?? 0),
      suggestion: averageByCategory.get(category) ?? null,
    }));

    // Biggest budget first, like every other list in the app.
    this.budgets = [...nextBudgets].sort((a, b) => b.budget - a.budget);
    this.totalBudget = Object.values(categoryBudgets).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0,
    );
    this.wage = Number(totalWage) || DEFAULT_TOTAL_WAGE;
    this.projectedSave = this.wage - this.totalBudget;

    if (!this.isEditing) {
      this.draftBudgets = { ...categoryBudgets };
      this.draftWage = this.wage;
    }
  }

  startEditing(): void {
    this.draftBudgets = { ...this.budgetSettingsService.settings().categoryBudgets };
    this.draftWage = this.budgetSettingsService.settings().defaultTotalWage;
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.draftBudgets = { ...this.budgetSettingsService.settings().categoryBudgets };
    this.draftWage = this.budgetSettingsService.settings().defaultTotalWage;
    this.isEditing = false;
  }

  async saveBudgetSettings(): Promise<void> {
    const payload = {
      categoryBudgets: Object.fromEntries(
        Object.entries(this.draftBudgets).map(([category, value]) => [
          category,
          Number(value) || 0,
        ]),
      ),
      defaultTotalWage: Number(this.draftWage) || DEFAULT_TOTAL_WAGE,
    };

    const saved = await this.budgetSettingsService.saveSettings(payload);
    this.syncDisplayState(saved.categoryBudgets, saved.defaultTotalWage);
    this.isEditing = false;
  }

  updateDraftBudget(category: string, value: string): void {
    const parsed = Number(value);
    this.draftBudgets = {
      ...this.draftBudgets,
      [category]: Number.isFinite(parsed) ? parsed : 0,
    };
  }

  setDraftWage(value: string | number): void {
    const parsed = Number(value);
    this.draftWage = Number.isFinite(parsed) ? parsed : 0;
  }
}
