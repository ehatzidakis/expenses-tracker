import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CATEGORY_BUDGETS, DEFAULT_TOTAL_WAGE } from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-category-budgets-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-budgets-grid.html',
})
export class CategoryBudgetsGrid {
  readonly privacyService = inject(PrivacyService);

  readonly budgets = Object.entries(CATEGORY_BUDGETS).map(([category, budget]) => ({
    category,
    budget,
  }));

  readonly totalBudget = Object.values(CATEGORY_BUDGETS).reduce(
    (acc, val) => (acc ?? 0) + (val ?? 0),
    0,
  );

  readonly projectedSave = DEFAULT_TOTAL_WAGE - (this.totalBudget ?? 0);
  readonly wage = DEFAULT_TOTAL_WAGE;

  getCategoryTextSize(category: string): string {
    // Customize logic based on character count
    if (category.length > 9) return 'text-[8.5px]';
    // if (category.length > 8) return 'text-[9px]';
    return 'text-[11px]';
  }
}
