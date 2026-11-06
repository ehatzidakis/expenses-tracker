import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { CategorySpend } from '../../services/expense-state.service';
import { StripeComponent } from '../stripe/stripe';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { MonthTiming, ordinal } from '../../utils/period-pace';

/**
 * The month at a glance: what's left of the budget, how far through the month we are, and the
 * stripe notched at today. "Saved from monthly budget" keeps its long-standing maths:
 * wage minus category spend.
 */
@Component({
  selector: 'app-month-summary',
  standalone: true,
  imports: [DecimalPipe, StripeComponent, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <section
      class="rounded-2xl border border-ink/10 bg-panel px-5 pt-4 pb-5 shadow-[inset_0_1px_0_rgb(241_230_210/0.06)]"
      aria-label="Month summary"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="type-wide flex items-baseline gap-2 font-bold leading-none" appSensitive>
            <span class="text-[40px] tracking-[-0.02em]" [class]="headlineTone()">
              €{{ headlineAmount() | number: '1.2-2' }}
            </span>
          </p>
          <p class=" text-[14px] text-ink-2">{{ headlineLabel() }}</p>
        </div>

        <div class="shrink-0 pt-1 text-right">
          <p class="type-wide text-[20px] font-semibold leading-none text-ink">{{ sideValue() }}</p>
          <p class="mt-1.5 text-[12px] text-ink-3">{{ sideLabel() }}</p>
        </div>
      </div>

      <app-stripe
        size="lg"
        [notchLabel]="todayLabel()"
        [animate]="true"
        [ratio]="ratio()"
        [pace]="timing().kind === 'current' ? timing().pace : null"
        [label]="stripeLabel()"
      />

      <p class="mt-2 flex items-baseline justify-between gap-3 text-[13px]" appSensitive="xs">
        <span>
          <span
            class="type-wide font-semibold"
            [class]="saved() >= 0 ? 'text-avocado' : 'text-cherry'"
            >{{ saved() < 0 ? '−' : '' }}€{{ abs(saved()) | number: '1.2-2' }}</span
          >
          <span class="text-ink-2"> {{ savedLabel() }}</span>
        </span>
        <!-- <span class="shrink-0 text-ink-3">of €{{ budget() | number: '0.0-0' }} budget</span> -->
      </p>
    </section>
  `,
})
export class MonthSummaryComponent {
  readonly categories = input.required<CategorySpend[]>();
  readonly totalWage = input(0);
  readonly timing = input.required<MonthTiming>();
  /** e.g. "October 2026"; names past and future months in the labels. */
  readonly monthName = input('');

  readonly spent = computed(() => this.categories().reduce((sum, c) => sum + c.amount, 0));
  readonly budget = computed(() => this.categories().reduce((sum, c) => sum + (c.budget ?? 0), 0));
  readonly left = computed(() => this.budget() - this.spent());
  readonly saved = computed(() => this.totalWage() - this.spent());
  readonly ratio = computed(() => (this.budget() > 0 ? this.spent() / this.budget() : 0));

  readonly headlineAmount = computed(() => this.spent());
  readonly headlineTone = computed(() => (this.left() < 0 ? 'text-cherry' : 'text-ink'));

  /** "this month" for the running month, "in October" for any other. */
  private readonly when = computed(() => {
    const month = this.monthName().split(' ')[0];
    return this.timing().kind === 'current' || !month ? 'this month' : `in ${month}`;
  });

  readonly headlineLabel = computed(() => `spent ${this.when()}`);

  readonly savedLabel = computed(() =>
    this.saved() >= 0 ? `saved ${this.when()}` : `more than the wage ${this.when()}`,
  );

  readonly sideValue = computed(() => {
    const t = this.timing();
    if (t.kind === 'current') return String(t.daysLeft);
    if (t.kind === 'future') return String(t.daysInMonth);
    return 'Final';
  });

  readonly sideLabel = computed(() => {
    const t = this.timing();
    if (t.kind === 'current') return t.daysLeft === 1 ? 'day to go' : 'days to go';
    if (t.kind === 'future') return 'days, not started';
    return 'month closed';
  });

  /** Today as "Fri. 13th", shown above the bar's notch. */
  readonly todayLabel = computed(() => {
    this.timing(); // recompute when the month changes
    const now = new Date();
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' });
    return `${weekday}. ${ordinal(now.getDate())}`;
  });

  readonly stripeLabel = computed(() => {
    const pct = Math.round(this.ratio() * 100);
    const t = this.timing();
    const pace =
      t.kind === 'current' && t.pace !== null
        ? `, ${Math.round(t.pace * 100)}% of the month gone`
        : '';
    return `${pct}% of the budget spent${pace}`;
  });

  abs(value: number): number {
    return Math.abs(value);
  }
}
