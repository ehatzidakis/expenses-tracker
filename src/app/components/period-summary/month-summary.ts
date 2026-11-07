import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { CategorySpend } from '../../services/expense-state.service';
import { StripeComponent } from '../stripe/stripe';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { MonthTiming, ordinal } from '../../utils/period-pace';

/**
 * The month at a glance: spent and saved side by side, and a thick bar notched at today that
 * carries the date and the days left. "Saved from monthly budget" keeps its long-standing maths:
 * wage minus category spend.
 */
@Component({
  selector: 'app-month-summary',
  standalone: true,
  imports: [DecimalPipe, StripeComponent, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <section
      class="rounded-2xl border border-ink/10 bg-panel px-5 pt-3.5 pb-4 shadow-[inset_0_1px_0_rgb(241_230_210/0.06)]"
      aria-label="Month summary"
    >
      <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div class="min-w-0">
          <p
            class="type-wide text-[34px] font-bold leading-none tracking-[-0.02em]"
            [class]="headlineTone()"
            appSensitive
          >
            €{{ headlineAmount() | number: '1.2-2' }}
          </p>
          <p class="mt-1 text-[13px] text-ink-2">{{ headlineLabel() }}</p>
        </div>

        <div class="ml-auto shrink-0 text-right">
          <p
            class="type-wide text-[22px] font-semibold leading-none"
            [class]="saved() >= 0 ? 'text-avocado' : 'text-cherry'"
            appSensitive="xs"
          >
            {{ saved() < 0 ? '−' : '' }}€{{ abs(saved()) | number: '1.2-2' }}
          </p>
          <p class="mt-1.5 text-[12px] text-ink-3">{{ savedLabel() }}</p>
        </div>
      </div>

      <app-stripe
        class="mt-3"
        [startLabel]="barStart()"
        [endLabel]="barEnd()"
        [animate]="true"
        [ratio]="ratio()"
        [label]="stripeLabel()"
      />

      <!-- Extra lines for the month, such as items waiting for review. -->
      <ng-content />
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

  /** Left end of the bar: today ("Sat 7th Nov"), or the month's state. */
  readonly barStart = computed(() => {
    const kind = this.timing().kind;
    if (kind === 'current') return this.todayLabel();
    if (kind === 'future') return 'Not started';
    return 'Month closed';
  });

  /** Right end of the bar: "24 days left" while the month runs, its length before it starts. */
  readonly barEnd = computed(() => {
    const t = this.timing();
    if (t.kind === 'current') return `${t.daysLeft} ${t.daysLeft === 1 ? 'day' : 'days'} left`;
    if (t.kind === 'future') return `${t.daysInMonth} days`;
    return '';
  });

  /** Today as "Fri 13th Nov", shown at the left end of the bar. */
  readonly todayLabel = computed(() => {
    this.timing(); // recompute when the month changes
    const now = new Date();
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' });
    const month = now.toLocaleDateString('en-GB', { month: 'short' });
    return `${weekday} ${ordinal(now.getDate())} ${month}`;
  });

  readonly stripeLabel = computed(() => {
    const pct = Math.round(this.ratio() * 100);
    const t = this.timing();
    const pace =
      t.kind === 'current' && t.pace !== null
        ? `, ${Math.round(t.pace * 100)}% of the month gone`
        : '';
    const days = t.kind === 'current' ? `, ${t.daysLeft} ${t.daysLeft === 1 ? 'day' : 'days'} left` : '';
    return `${pct}% of the budget spent${pace}${days}`;
  });

  abs(value: number): number {
    return Math.abs(value);
  }
}
