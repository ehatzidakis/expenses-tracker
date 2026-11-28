import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { BudgetPeriod, formatMonthKey, periodSummaries } from '../../utils/budget-history';

/** Each budget period with its wage, what was budgeted and what that left to save. */
@Component({
  selector: 'app-budget-periods',
  standalone: true,
  host: { class: 'block' },
  imports: [CommonModule, SensitiveDirective],
  template: `
    @if (rows().length > 1) {
      <section aria-labelledby="budget-periods-heading">
        <h2 id="budget-periods-heading" class="type-wide text-[13px] font-semibold uppercase text-ink-2">
          Periods
        </h2>
        <ul class="mt-2 divide-y divide-ink/10 border-y border-ink/10">
          @for (row of rows(); track row.from) {
            <li class="flex flex-col gap-1 py-2.5">
              <span class="text-[15px] text-ink">{{ row.range }}</span>
              <span class="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-3 tabular-nums">
                <span
                  >Wage
                  <span class="text-ink-2" appSensitive="xs" data-amount
                    >€{{ row.wage | number: '1.2-2' }}</span
                  ></span
                >
                <span
                  >Budgeted
                  <span class="text-ink-2" appSensitive="xs" data-amount
                    >€{{ row.budgeted | number: '1.2-2' }}</span
                  ></span
                >
                <span
                  >Left
                  <span
                    [class]="row.left >= 0 ? 'text-avocado' : 'text-cherry'"
                    appSensitive="xs"
                    data-amount
                    >€{{ row.left | number: '1.2-2' }}</span
                  ></span
                >
              </span>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class BudgetPeriodsComponent {
  /** Every budget period, oldest first. */
  readonly history = input.required<BudgetPeriod[]>();

  readonly rows = computed(() =>
    periodSummaries(this.history()).map((row) => ({
      ...row,
      range:
        row.to === null
          ? `${formatMonthKey(row.from)} –`
          : `${formatMonthKey(row.from)} – ${formatMonthKey(row.to)}`,
    })),
  );
}
