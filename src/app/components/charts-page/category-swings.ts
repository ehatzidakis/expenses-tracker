import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { getCategoryMeta } from '../../services/expense-state.service';
import { CategorySwing, MIN_SWING_MONTHS } from '../../utils/chart-data';
import { categoryLabel } from '../../utils/period-pace';
import { SensitiveDirective } from '../../utils/sensitive.directive';

/**
 * How steady each category is from month to month: its coefficient of variation (standard
 * deviation ÷ average) as one ember bar per row on a shared scale, least steady first, with
 * the range most months land in written out underneath.
 */
@Component({
  selector: 'app-category-swings',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, SensitiveDirective],
  host: { class: 'block' },
  template: `
    @if (rows().length === 0) {
      <p class="border-t border-ink/10 py-4 text-[13px] text-ink-3">
        Swings appear once {{ minMonths }} months in this range have finished.
      </p>
    } @else {
      <ul class="divide-y divide-ink/10 border-t border-ink/10">
        @for (row of rows(); track row.name) {
          <li class="py-2.5">
            <div class="flex items-baseline justify-between gap-3">
              <span class="flex min-w-0 items-baseline gap-2">
                <span class="w-5 shrink-0 text-[13px] opacity-60 grayscale-[40%]" aria-hidden="true">{{
                  row.emoji
                }}</span>
                <span class="truncate text-[15px] font-medium text-ink">{{ row.label }}</span>
              </span>
              <span class="shrink-0 text-[13px] tabular-nums text-ink">
                {{ row.cv | percent: '1.0-0' }}
              </span>
            </div>
            <div class="relative ml-7 mt-1.5 h-1 rounded-full bg-ink/[0.07]" aria-hidden="true">
              <div
                class="absolute inset-y-0 left-0 rounded-full bg-ember transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                [style.width.%]="row.barPct"
              ></div>
            </div>
            <p class="ml-7 mt-1 text-[12px] text-ink-3" appSensitive="xs">
              @if (row.steady) {
                The same every month: €{{ row.mean | number: '1.0-0' }}
              } @else {
                Usually €{{ row.low | number: '1.0-0' }}–€{{ row.high | number: '1.0-0' }}, about €{{
                  row.mean | number: '1.0-0'
                }}
                on average
              }
            </p>
          </li>
        }
      </ul>
    }
  `,
})
export class CategorySwingsComponent {
  readonly swings = input.required<CategorySwing[]>();
  protected readonly minMonths = MIN_SWING_MONTHS;

  /** One shared 0–max scale, so bar lengths compare across categories. */
  readonly rows = computed(() => {
    const swings = this.swings();
    const peak = Math.max(0.0001, ...swings.map((s) => s.cv));
    return swings.map((s) => ({
      ...s,
      label: categoryLabel(s.name),
      emoji: getCategoryMeta(s.name).emoji,
      steady: s.sd < 0.005,
      barPct: (s.cv / peak) * 100,
    }));
  });
}
