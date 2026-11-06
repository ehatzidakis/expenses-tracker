import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { SensitiveDirective } from '../../utils/sensitive.directive';

@Component({
  selector: 'app-category-budget-summary',
  standalone: true,
  host: { class: 'block' },
  imports: [CommonModule, SensitiveDirective],
  template: `
    <dl class="grid grid-cols-3 gap-3">
      <div>
        <dt class="text-[12px] text-ink-3">Wage</dt>
        <dd class="type-wide mt-1 text-[16px] font-semibold text-ink" appSensitive="sm">
          €{{ wage() | number: '1.2-2' }}
        </dd>
      </div>
      <div>
        <dt class="text-[12px] text-ink-3">Budgeted</dt>
        <dd class="type-wide mt-1 text-[16px] font-semibold text-ink" appSensitive="sm">
          €{{ totalBudget() | number: '1.2-2' }}
        </dd>
      </div>
      <div class="text-right">
        <dt class="text-[12px] text-ink-3">Left to save</dt>
        <dd
          class="type-wide mt-1 text-[16px] font-semibold"
          [class]="projectedSave() >= 0 ? 'text-avocado' : 'text-cherry'"
          appSensitive="sm"
        >
          {{ projectedSave() < 0 ? '−' : '' }}€{{ abs(projectedSave()) | number: '1.2-2' }}
        </dd>
      </div>
    </dl>
  `,
})
export class CategoryBudgetSummaryComponent {
  abs(value: number): number {
    return Math.abs(value);
  }

  readonly wage = input(0);
  readonly totalBudget = input.required<number>();
  readonly projectedSave = input.required<number>();
}
