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
}
