import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { YearlyBreakdownEntry } from './overview-card.models';
import { SensitiveDirective } from '../../utils/sensitive.directive';

export type { YearlyBreakdownEntry } from './overview-card.models';

/**
 * All time at a glance, in the same shape as the month summary: one wide figure, a side figure,
 * then the plain lines that add up to it. Each year can be opened below.
 */
@Component({
  selector: 'app-overview-card',
  standalone: true,
  imports: [DecimalPipe, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <section
      class="rounded-2xl border border-ink/10 bg-panel px-5 pt-4 pb-2 shadow-[inset_0_1px_0_rgb(241_230_210/0.06)]"
      aria-label="All time summary"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p
            class="type-wide text-[clamp(30px,9vw,40px)] font-bold leading-none tracking-[-0.02em] text-ink"
            appSensitive
          >
            €{{ totalSpend() | number: '1.2-2' }}
          </p>
          <p class="mt-2 text-[14px] text-ink-2">spent in total</p>
        </div>

        <div class="shrink-0 pt-1 text-right">
          <p
            class="type-wide text-[20px] font-semibold leading-none"
            [class]="totalSaved() >= 0 ? 'text-avocado' : 'text-cherry'"
            appSensitive="sm"
          >
            {{ sign(totalSaved()) }}€{{ abs(totalSaved()) | number: '1.2-2' }}
          </p>
          <p class="mt-1.5 text-[12px] text-ink-3">saved overall</p>
        </div>
      </div>

      @if (rangeLine(); as range) {
        <p class="mt-3 text-[13px] text-ink-3">{{ range }}</p>
      }

      <dl class="mt-4 divide-y divide-ink/10 border-t border-ink/10 text-[13px]">
        <div class="flex items-baseline justify-between gap-3 py-2.5">
          <dt class="text-ink-2">Spent on months</dt>
          <dd class="tabular-nums text-ink" appSensitive="xs">€{{ monthlyExpenses() | number: '1.2-2' }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3 py-2.5">
          <dt class="text-ink-2">Spent on one-offs</dt>
          <dd class="tabular-nums text-ink" appSensitive="xs">€{{ oneOffExpenses() | number: '1.2-2' }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3 py-2.5">
          <dt class="text-ink-2">One-off income</dt>
          <dd class="tabular-nums text-avocado-ink" appSensitive="xs">+€{{ oneOffBonuses() | number: '1.2-2' }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3 py-2.5">
          <dt class="text-ink-2">Saved from monthly budget</dt>
          <dd
            class="tabular-nums"
            [class]="monthlySaved() >= 0 ? 'text-avocado-ink' : 'text-cherry'"
            appSensitive="xs"
          >
            {{ sign(monthlySaved()) }}€{{ abs(monthlySaved()) | number: '1.2-2' }}
          </dd>
        </div>
      </dl>

      @if (yearlyBreakdown().length) {
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-between border-t border-ink/10 text-[13px] text-ink-2 cursor-pointer hover:text-ink"
          [attr.aria-expanded]="expanded()"
          (click)="expanded.update((open) => !open)"
        >
          By year
          <svg
            class="size-3.5 text-ink-3 transition-transform duration-200"
            [class.rotate-180]="expanded()"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        @if (expanded()) {
          <table class="mb-3 w-full text-[13px] tabular-nums">
            <thead>
              <tr class="text-left text-[12px] text-ink-3">
                <th class="py-1.5 font-normal">Year</th>
                <th class="py-1.5 text-right font-normal">Spent</th>
                <th class="py-1.5 text-right font-normal">Saved</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink/10">
              @for (year of years(); track year.year) {
                <tr>
                  <th class="type-wide py-2 text-left font-semibold text-ink" scope="row">{{ year.year }}</th>
                  <td class="py-2 text-right text-ink" appSensitive="xs">€{{ year.spent | number: '1.2-2' }}</td>
                  <td
                    class="py-2 text-right"
                    [class]="year.saved >= 0 ? 'text-avocado-ink' : 'text-cherry'"
                    appSensitive="xs"
                  >
                    {{ sign(year.saved) }}€{{ abs(year.saved) | number: '1.2-2' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      }
    </section>
  `,
})
export class OverviewCardComponent {
  readonly totalSpend = input.required<number>();
  readonly totalSaved = input(0);
  readonly monthlyExpenses = input(0);
  readonly oneOffExpenses = input(0);
  /** Wage minus category spend, summed over the months. */
  readonly monthlySaved = input(0);
  readonly oneOffBonuses = input(0);
  readonly yearlyBreakdown = input<YearlyBreakdownEntry[]>([]);
  readonly dateRangeInfo = input<{ count: number; first: string; last: string } | null>(null);

  readonly expanded = signal(false);

  readonly rangeLine = computed(() => {
    const info = this.dateRangeInfo();
    if (!info) return '';
    const months = `${info.count} month${info.count === 1 ? '' : 's'}`;
    return info.first === info.last ? `${months} · ${info.first}` : `${months} · ${info.first} – ${info.last}`;
  });

  readonly years = computed(() =>
    this.yearlyBreakdown().map((y) => ({
      year: y.year,
      spent: y.monthlyExpenses + y.oneOffExpenses,
      saved: y.monthlySaved + y.oneOffBonuses - y.oneOffExpenses,
    })),
  );

  sign(value: number): string {
    return value < 0 ? '−' : '';
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}
