import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ExpenseStateService, getCategoryMeta } from '../../services/expense-state.service';
import { BudgetSettingsService } from '../../services/budget-settings.service';
import {
  ChartRange,
  averageMonth,
  categoryAverages,
  inRange,
  monthTotals,
} from '../../utils/chart-data';
import { categoryLabel } from '../../utils/period-pace';
import { SEGMENT_BASE, SEGMENT_FRAME, SEGMENT_OFF, SEGMENT_ON } from '../../utils/pill-styles';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { MonthChartComponent } from './month-chart';
import { UtilitySumComponent } from '../utility-sum-component/utility-sum-component';
import { CategoryAverageComponent } from '../category-average/category-average';

const RANGES: ReadonlyArray<{ id: ChartRange; label: string }> = [
  { id: '6m', label: '6M' },
  { id: '12m', label: '12M' },
  { id: 'all', label: 'All' },
];

/**
 * The Charts tab: looking back across months. A range switch scopes the first two sections;
 * typical costs come from all-time totals kept in the database.
 */
@Component({
  selector: 'app-charts-page',
  standalone: true,
  imports: [
    DecimalPipe,
    SensitiveDirective,
    MonthChartComponent,
    UtilitySumComponent,
    CategoryAverageComponent,
  ],
  host: { class: 'flex flex-col gap-8' },
  template: `
    <div class="flex flex-col gap-3">
      <div role="group" aria-label="Range" [class]="frame + ' grid-cols-3'">
        @for (option of ranges; track option.id) {
          <button
            type="button"
            [class]="segment(range() === option.id)"
            [attr.aria-pressed]="range() === option.id"
            (click)="range.set(option.id)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      @if (average().count > 0) {
        <div class="flex items-start justify-between gap-4 pt-1">
          <div class="min-w-0">
            <p
              class="type-wide text-[clamp(30px,9vw,40px)] font-bold leading-none tracking-[-0.02em] text-ink"
              appSensitive
            >
              €{{ average().spent | number: '1.2-2' }}
            </p>
            <p class="mt-2 text-[14px] text-ink-2">spent in an average month</p>
          </div>
          <div class="shrink-0 pt-1 text-right">
            <p
              class="type-wide text-[18px] font-semibold leading-none"
              [class]="average().saved >= 0 ? 'text-avocado' : 'text-cherry'"
              appSensitive="sm"
            >
              {{ average().saved < 0 ? '−' : '' }}€{{ abs(average().saved) | number: '1.2-2' }}
            </p>
            <p class="mt-1.5 text-[12px] text-ink-3">saved</p>
          </div>
        </div>
        <p class="text-[12px] text-ink-3">
          Average of {{ average().count }} finished {{ average().count === 1 ? 'month' : 'months' }}
        </p>
      }
    </div>

    @if (state.expensesQuery.isPending()) {
      <div class="flex animate-pulse flex-col gap-5" aria-label="Loading charts">
        <div class="h-64 rounded-xl bg-panel"></div>
        <div class="h-80 rounded-xl bg-panel/60"></div>
      </div>
    } @else if (state.expensesQuery.isError()) {
      <div role="alert" class="flex flex-col items-start gap-3 border-y border-ink/10 py-6">
        <p class="text-[15px] text-ink">Couldn't load your months.</p>
        <p class="text-[13px] text-ink-3">Check your connection and try again.</p>
        <button
          type="button"
          class="min-h-11 rounded-xl border border-edge px-4 text-[13px] font-medium text-ink-2 hover:border-ink-4 hover:text-ink cursor-pointer"
          (click)="state.expensesQuery.refetch()"
        >
          Try again
        </button>
      </div>
    } @else if (months().length === 0) {
      <p class="border-y border-ink/10 py-6 text-[14px] text-ink-3">
        No months yet. Charts appear once you have logged a month.
      </p>
    } @else {
      <section aria-labelledby="chart-months" class="flex flex-col gap-3">
        <h2 id="chart-months" class="type-wide text-[13px] font-semibold uppercase text-ink-2">Month by month</h2>

        @if (selected(); as m) {
          <div class="flex items-baseline justify-between gap-3" aria-live="polite">
            <p class="text-[15px] font-medium text-ink">
              {{ m.monthName }}
              @if (m.current) {
                <span class="text-[13px] font-normal text-ink-3">so far</span>
              }
            </p>
            <p class="text-right text-[13px] text-ink-2" appSensitive="xs">
              €{{ m.spent | number: '1.2-2' }}
              <span class="text-ink-3">of €{{ m.budget | number: '1.0-0' }}</span>
            </p>
          </div>
          <p class="-mt-2 text-[13px]" appSensitive="xs">
            @if (m.current && m.budget > 0 && m.spent <= m.budget + 0.005) {
              <span class="text-ink-3">€{{ m.budget - m.spent | number: '1.2-2' }} left to spend</span>
            } @else if (m.budget > 0 && m.spent > m.budget + 0.005) {
              <span class="font-semibold text-cherry">€{{ m.spent - m.budget | number: '1.2-2' }} over budget</span>
            } @else if (m.budget > 0) {
              <span class="text-ink-3">€{{ m.budget - m.spent | number: '1.2-2' }} under budget</span>
            }
            <span class="text-ink-3"> · </span>
            <span [class]="m.saved >= 0 ? 'text-avocado' : 'text-cherry'"
              >{{ m.saved < 0 ? '−' : '' }}€{{ abs(m.saved) | number: '1.2-2' }} saved</span
            >
          </p>
        }

        <app-month-chart [months]="months()" [selectedId]="selected()?.id ?? null" (select)="selectedId.set($event)" />
      </section>

      <section aria-labelledby="chart-typical" class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between gap-3">
          <h2 id="chart-typical" class="type-wide text-[13px] font-semibold uppercase text-ink-2">Typical month</h2>
          <span class="text-[12px] text-ink-3">Monthly average vs budget</span>
        </div>

        @if (typical().length === 0) {
          <p class="border-t border-ink/10 py-4 text-[13px] text-ink-3">
            Averages appear once a month in this range has finished.
          </p>
        } @else {
          <ul class="divide-y divide-ink/10 border-t border-ink/10">
            @for (row of typical(); track row.name) {
              <li class="py-2.5">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="flex min-w-0 items-baseline gap-2">
                    <span class="w-5 shrink-0 text-[13px] opacity-60 grayscale-[40%]" aria-hidden="true">{{ row.emoji }}</span>
                    <span class="truncate text-[15px] font-medium text-ink">{{ row.label }}</span>
                  </span>
                  <span class="shrink-0 text-[13px] tabular-nums text-ink" appSensitive="xs">
                    €{{ row.average | number: '1.2-2' }}
                    @if (row.budget !== null) {
                      <span class="text-ink-3">/ €{{ row.budget | number: '1.0-0' }}</span>
                    }
                  </span>
                </div>
                <div class="relative ml-7 mt-1.5 h-3" aria-hidden="true">
                  <div class="absolute inset-x-0 top-1 h-1 rounded-full bg-ink/[0.07]"></div>
                  <div
                    class="absolute left-0 top-1 h-1 rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    [class]="row.over ? 'bg-cherry' : 'bg-ember'"
                    [style.width.%]="row.barPct"
                  ></div>
                  @if (row.budgetPct !== null) {
                    <div
                      class="absolute top-0 h-3 w-[2px] -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_2px_var(--color-ground)] transition-[left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      [style.left.%]="row.budgetPct"
                    ></div>
                  }
                </div>
                @if (row.over) {
                  <p class="ml-7 mt-1 text-[12px] font-semibold text-cherry" appSensitive="xs">
                    €{{ row.average - row.budget! | number: '1.2-2' }} over budget on average
                  </p>
                }
              </li>
            }
          </ul>
          @if (unused().length) {
            <p class="border-t border-ink/10 py-3 text-[13px] text-ink-3">Nothing spent · {{ unused() }}</p>
          }
        }
      </section>
    }

    <section aria-labelledby="chart-costs" class="flex flex-col gap-6">
      <div class="flex items-baseline justify-between gap-3">
        <h2 id="chart-costs" class="type-wide text-[13px] font-semibold uppercase text-ink-2">Typical costs</h2>
        <span class="text-[12px] text-ink-3">All time</span>
      </div>
      <app-utility-sum />
      <app-category-average />
    </section>
  `,
})
export class ChartsPageComponent {
  readonly state = inject(ExpenseStateService);
  private readonly budgets = inject(BudgetSettingsService);

  protected readonly ranges = RANGES;
  protected readonly frame = SEGMENT_FRAME;

  readonly range = signal<ChartRange>('12m');
  readonly selectedId = signal<string | null>(null);

  private readonly budgetFor = (name: string) => this.budgets.getCategoryBudget(name);

  private readonly allMonths = computed(() =>
    monthTotals(this.state.expensesQuery.data() ?? [], this.budgetFor),
  );

  readonly months = computed(() => inRange(this.allMonths(), this.range()));
  readonly average = computed(() => averageMonth(this.months()));

  /** The tapped month, or the newest one in range. */
  readonly selected = computed(() => {
    const months = this.months();
    return months.find((m) => m.id === this.selectedId()) ?? months[months.length - 1] ?? null;
  });

  private readonly averages = computed(() =>
    categoryAverages(this.state.expensesQuery.data() ?? [], this.months(), this.budgetFor),
  );

  /** Ranked rows on one shared € scale, so bar lengths compare across categories. */
  readonly typical = computed(() => {
    const rows = this.averages().filter((row) => row.average > 0.005);
    const peak = Math.max(1, ...rows.flatMap((row) => [row.average, row.budget ?? 0]));
    return rows.map((row) => ({
      name: row.name,
      label: categoryLabel(row.name),
      emoji: getCategoryMeta(row.name).emoji,
      average: row.average,
      budget: row.budget,
      over: row.budget !== null && row.average > row.budget + 0.005,
      barPct: (row.average / peak) * 100,
      budgetPct: row.budget !== null ? (row.budget / peak) * 100 : null,
    }));
  });

  readonly unused = computed(() =>
    this.averages()
      .filter((row) => row.average <= 0.005)
      .map((row) => categoryLabel(row.name))
      .join(', '),
  );

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}
