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

@Component({
  selector: 'app-category-budgets-grid',
  standalone: true,
  imports: [
    CategoryBudgetCardsComponent,
    CategoryBudgetEditControlsComponent,
    CategoryBudgetSummaryComponent,
  ],
  template: `
    <div class="space-y-6">
      <div
        class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm overflow-hidden select-none"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-100">
              Monthly Allocated Budget Per Category
            </h3>
          </div>

          @if (!isEditing) {
            <button
              type="button"
              class="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-indigo-200 transition hover:bg-indigo-500/20"
              (click)="startEditing()"
            >
              Edit
            </button>
          }
        </div>

        <app-category-budget-cards
          [budgets]="budgets"
          [isEditing]="isEditing"
          [draftBudgets]="draftBudgets"
          (budgetChange)="updateDraftBudget($event.category, $event.value)"
        />

        <app-category-budget-edit-controls
          [isEditing]="isEditing"
          [draftWage]="draftWage"
          (wageChange)="setDraftWage($event)"
          (cancel)="cancelEditing()"
          (save)="saveBudgetSettings()"
        />

        <app-category-budget-summary
          [totalBudget]="totalBudget"
          [projectedSave]="projectedSave"
        />
      </div>
    </div>
  `,
})
export class CategoryBudgetsGrid implements OnInit {
  private readonly expenseState = inject(ExpenseStateService);
  private readonly budgetSettingsService = inject(BudgetSettingsService);

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
    const nextBudgets = Object.entries(categoryBudgets).map(([category, budget]) => ({
      category,
      budget: Number(budget ?? 0),
      suggestion:
        this.expenseState.categoryBreakdown().find((item) => item.name === category)
          ?.monthlyAverage ?? null,
    }));

    this.budgets = nextBudgets;
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
