import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface BudgetCardItem {
  category: string;
  budget: number;
  suggestion: number | null;
}

@Component({
  selector: 'app-category-budget-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-4 gap-1">
      @for (item of budgets(); track item.category) {
        <div
          class="bg-gray-800/40 border border-gray-800/60 rounded-2xl p-3.5 flex flex-col justify-between"
        >
          <span
            class="font-medium text-gray-400 block whitespace-nowrap"
            [class]="getCategoryTextSize(item.category)"
          >
            {{ item.category }}
          </span>

          @if (isEditing()) {
            <label class="mt-2 block text-[10px] text-gray-400">
              <span class="mb-1 block">Budget</span>
              <div
                class="flex items-center gap-1 rounded-md border border-gray-700 bg-gray-950/70 px-2 py-1.5"
              >
                <span class="text-gray-400">€</span>
                <input
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  pattern="[0-9]*"
                  class="w-full bg-transparent text-sm text-white outline-none"
                  [ngModel]="draftBudgets()[item.category] ?? 0"
                  (ngModelChange)="budgetChange.emit({ category: item.category, value: $event })"
                />
              </div>
              @if (item.suggestion !== null) {
                <span class="mt-1 block text-[9px] text-indigo-300">
                  suggested: €{{ item.suggestion | number: '1.0-0' }}
                </span>
              }
            </label>
          } @else {
            <span class="text-base font-semibold text-gray-100 mt-1">
              €{{ item.budget | number: '1.0-0' }}
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class CategoryBudgetCardsComponent {
  readonly budgets = input.required<BudgetCardItem[]>();
  readonly isEditing = input(false);
  readonly draftBudgets = input<Record<string, number>>({});

  readonly budgetChange = output<{ category: string; value: string }>();

  getCategoryTextSize(category: string): string {
    if (category.length > 9) return 'text-[8.5px]';
    return 'text-[11px]';
  }
}
