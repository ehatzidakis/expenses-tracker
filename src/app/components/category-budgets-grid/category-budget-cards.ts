import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { getCategoryMeta } from '../../services/expense-state.service';
import { categoryLabel } from '../../utils/period-pace';

export interface BudgetCardItem {
  category: string;
  budget: number;
  suggestion: number | null;
}

@Component({
  selector: 'app-category-budget-cards',
  standalone: true,
  host: { class: 'block' },
  imports: [CommonModule, FormsModule, SensitiveDirective],
  template: `
    <ul class="divide-y divide-ink/10 border-y border-ink/10">
      @for (item of budgets(); track item.category) {
        <li class="flex min-h-12 items-center justify-between gap-3 py-2">
          <label [for]="'budget-' + item.category" class="flex min-w-0 items-center gap-2">
            <span class="w-5 shrink-0 text-[13px] opacity-60 grayscale-[40%]" aria-hidden="true">{{
              emoji(item.category)
            }}</span>
            <span class="truncate text-[15px] text-ink">{{ label(item.category) }}</span>
          </label>
          @if (isEditing()) {
            <span class="flex shrink-0 flex-col items-end gap-0.5">
              <span
                class="flex min-h-12 w-28 items-center gap-1 rounded-xl border border-edge bg-panel px-3 transition-colors focus-within:border-ember"
              >
                <span class="text-ink-3" aria-hidden="true">€</span>
                <input
                  [id]="'budget-' + item.category"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  pattern="[0-9]*"
                  class="w-full bg-transparent text-right text-ink tabular-nums focus-visible:outline-none"
                  [ngModel]="draftBudgets()[item.category] ?? 0"
                  (ngModelChange)="budgetChange.emit({ category: item.category, value: $event })"
                />
              </span>
              @if (item.suggestion !== null) {
                <span class="text-[12px] text-ink-3">Suggested €{{ item.suggestion | number: '1.0-0' }}</span>
              }
            </span>
          } @else {
            <span class="shrink-0 text-[13px] text-ink tabular-nums" appSensitive="xs">
              €{{ item.budget | number: '1.2-2' }}
            </span>
          }
        </li>
      }
    </ul>
  `,
})
export class CategoryBudgetCardsComponent {
  readonly budgets = input.required<BudgetCardItem[]>();
  readonly isEditing = input(false);
  readonly draftBudgets = input<Record<string, number>>({});

  readonly budgetChange = output<{ category: string; value: string }>();

  emoji(category: string): string {
    return getCategoryMeta(category).emoji;
  }

  label(category: string): string {
    return categoryLabel(category);
  }
}
