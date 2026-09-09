import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CATEGORY_BUDGETS,
  DEFAULT_TOTAL_WAGE,
  ExpenseStateService,
} from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';
import { BudgetSettingsService } from '../../services/budget-settings.service';

interface BudgetCardItem {
  category: string;
  budget: number;
  suggestion: number | null;
}

@Component({
  selector: 'app-category-budgets-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-budgets-grid.html',
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

  getCategoryTextSize(category: string): string {
    if (category.length > 9) return 'text-[8.5px]';
    return 'text-[11px]';
  }
}
