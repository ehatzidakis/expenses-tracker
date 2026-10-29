import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { SensitiveDirective } from '../../utils/sensitive.directive';

@Component({
  selector: 'app-category-budget-summary',
  standalone: true,
  host: { class: 'block' },
  imports: [CommonModule, SensitiveDirective],
  template: `
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div
          class="bg-indigo-950/30 border border-indigo-800/50 rounded-2xl p-2 flex items-center justify-between"
        >
          <span class="text-xs font-semibold uppercase tracking-wider text-indigo-300"
            >Total Budgeted Sum</span
          >
          <span class="text-lg font-bold text-indigo-200" appSensitive>
            €{{ totalBudget() | number: '1.0-0' }}
          </span>
        </div>
        <div
          class="bg-indigo-950/30 border border-indigo-800/50 rounded-2xl p-2 flex items-center justify-between"
        >
          <span class="text-xs font-semibold uppercase tracking-wider text-indigo-300"
            >Monthly Savings</span
          >
          <span class="text-lg font-bold text-indigo-200" appSensitive>
            €{{ projectedSave() | number: '1.0-0' }}
          </span>
        </div>
      </div>
    </div>
  `,
})
export class CategoryBudgetSummaryComponent {
  readonly totalBudget = input.required<number>();
  readonly projectedSave = input.required<number>();
}
