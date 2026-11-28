import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { getCategoryMeta } from '../../services/expense-state.service';
import { categoryLabel } from '../../utils/period-pace';
import {
  BudgetPeriod,
  CategoryBudgetStep,
  categoryHistory,
  formatMonthKey,
} from '../../utils/budget-history';

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
        @let steps = isEditing() ? [] : (stepsByCategory().get(item.category) ?? []);
        @if (steps.length > 1) {
          <li>
            <!-- A budget that changed opens its past amounts and the months they covered -->
            <button
              type="button"
              class="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 py-2 text-left"
              [attr.aria-expanded]="isOpen(item.category)"
              [attr.aria-controls]="'budget-history-' + item.category"
              (click)="toggle(item.category)"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span class="w-5 shrink-0 text-[13px] opacity-60 grayscale-[40%]" aria-hidden="true">{{
                  emoji(item.category)
                }}</span>
                <span class="truncate text-[15px] text-ink">{{ label(item.category) }}</span>
                <span class="shrink-0 text-[12px] text-ink-3">History</span>
              </span>
              <span class="flex shrink-0 items-center gap-1.5">
                <span class="text-[13px] text-ink tabular-nums" appSensitive="xs">
                  €{{ item.budget | number: '1.2-2' }}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  class="size-3.5 text-ink-3 transition-transform duration-150"
                  [class.rotate-90]="isOpen(item.category)"
                  aria-hidden="true"
                >
                  <path
                    d="M6 3.5 10.5 8 6 12.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>
            @if (isOpen(item.category)) {
              <ul [id]="'budget-history-' + item.category" class="flex flex-col gap-1.5 pb-3 pl-7">
                @for (step of steps; track step.from) {
                  <li class="flex items-baseline justify-between gap-3 text-[13px]">
                    <span class="text-ink-3">{{ range(step) }}</span>
                    <span
                      class="tabular-nums"
                      [class]="$first ? 'text-ink' : 'text-ink-2'"
                      appSensitive="xs"
                    >
                      €{{ step.amount | number: '1.2-2' }}
                    </span>
                  </li>
                }
              </ul>
            }
          </li>
        } @else {
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
      }
    </ul>
  `,
})
export class CategoryBudgetCardsComponent {
  readonly budgets = input.required<BudgetCardItem[]>();
  readonly isEditing = input(false);
  readonly draftBudgets = input<Record<string, number>>({});
  /** Every budget period, oldest first. */
  readonly history = input<BudgetPeriod[]>([]);

  readonly budgetChange = output<{ category: string; value: string }>();

  private readonly open = signal<ReadonlySet<string>>(new Set());

  readonly stepsByCategory = computed(
    () =>
      new Map(
        this.budgets().map((item) => [item.category, categoryHistory(this.history(), item.category)]),
      ),
  );

  isOpen(category: string): boolean {
    return this.open().has(category);
  }

  toggle(category: string): void {
    const next = new Set(this.open());
    if (!next.delete(category)) next.add(category);
    this.open.set(next);
  }

  /** "since Aug 2026" for the amount in force, "Mar 2026 – Jul 2026" for an earlier one. */
  range(step: CategoryBudgetStep): string {
    return step.to === null
      ? `since ${formatMonthKey(step.from)}`
      : `${formatMonthKey(step.from)} – ${formatMonthKey(step.to)}`;
  }

  emoji(category: string): string {
    return getCategoryMeta(category).emoji;
  }

  label(category: string): string {
    return categoryLabel(category);
  }
}
