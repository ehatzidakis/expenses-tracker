import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { CategorySpend, getCategoryMeta } from '../../services/expense-state.service';
import { CategoryBreakdownDetailsComponent } from './category-breakdown-details';

@Component({
  selector: 'app-category-breakdown-item',
  standalone: true,
  imports: [CommonModule, CategoryBreakdownDetailsComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5 border border-gray-800/60 px-3 py-1.5 rounded-xl bg-amber-50/5">
      <button
        type="button"
        class="w-full text-left space-y-1.5 cursor-pointer"
        [attr.aria-expanded]="expanded()"
        (click)="toggle.emit()"
      >
        <div class="flex items-center justify-between text-xs py-0.5">
          <div class="flex items-center gap-2 min-w-0 pr-2">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full text-[14px] leading-none shadow-inner"
              [ngClass]="categoryMeta(category().name).classes"
              aria-hidden="true"
            >
              {{ categoryMeta(category().name).emoji }}
            </span>

            <span class="font-medium text-gray-300 text-sm">{{ category().name }}</span>
            <span class="text-gray-400 tabular-nums text-[10px]">
              ({{ category().percentage | number: '1.1-1' }}%)
            </span>
          </div>

          <div class="flex items-end gap-2 shrink-0 justify-end pr-1">
            <div class="text-right">
              <div class="text-[13px] text-white-40 tabular-nums">
                @if (!category().isAllTime && category().budget !== null) {
                  <span>
                    €{{ category().amount | number: '1.2-2' }}
                    <span class="text-gray-500 text-xs">
                      / €{{ category().budget | number: '1.2-2' }}
                    </span>
                  </span>
                } @else {
                  <span>€{{ category().amount | number: '1.2-2' }}</span>
                }
              </div>

              @if (!category().isAllTime && category().budget !== null) {
                @if (category().isOverBudget) {
                  <div class="mt-1 text-[10px] font-medium text-red-400 tabular-nums">
                    €{{
                      (category().monthlyAverage ?? category().amount) - (category().budget ?? 0)
                        | number: '1.2-2'
                    }}
                  </div>
                } @else {
                  <div class="mt-1 text-[11px] font-medium text-teal-300/90 tabular-nums">
                    €{{
                      (category().budget ?? 0) - (category().monthlyAverage ?? category().amount)
                        | number: '1.2-2'
                    }}
                    left
                  </div>
                }
              }
            </div>
          </div>
        </div>

        @if (category().isAllTime && category().monthlyAverage !== null) {
          <div class="flex items-center justify-between text-xs w-full gap-2 py-0.5">
            <span
              class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tabular-nums"
            >
              €{{ category().budget | number: '1.2-2' }} / mo budget
            </span>
            <span
              class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tabular-nums"
            >
              €{{ category().monthlyAverage | number: '1.2-2' }} / mo average
            </span>
          </div>
        }

        @if (!category().isAllTime) {
          <div class="mt-2.5">
            <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                [class]="
                  category().isOverBudget
                    ? 'bg-linear-to-r from-red-600 to-rose-800'
                    : 'bg-linear-to-r from-indigo-500 to-violet-500'
                "
                class="h-full rounded-full transition-all duration-300"
                [style.width.%]="
                  (category().amount / (category().budget ?? category().amount)) * 100
                "
              ></div>
            </div>
            <div class="mt-1.5 text-[10px] text-gray-400">
              {{ transactionCount() }} transaction{{ transactionCount() === 1 ? '' : 's' }}
            </div>
          </div>
        }
      </button>

      @if (expanded()) {
        <app-category-breakdown-details
          [category]="category()"
          [monthName]="monthName()"
          (changed)="changed.emit()"
        />
      }
    </div>
  `,
})
export class CategoryBreakdownItemComponent {
  readonly category = input.required<CategorySpend>();
  readonly monthName = input.required<string>();
  readonly transactionCount = input(0);
  readonly expanded = input(false);

  readonly toggle = output<void>();
  readonly changed = output<void>();

  categoryMeta(name: string): { emoji: string; classes: string } {
    return getCategoryMeta(name);
  }
}
