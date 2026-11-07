import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { StripeComponent } from '../stripe/stripe';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import type { BudgetStatus } from '../../utils/period-pace';

export type RowTone = BudgetStatus | 'share';

/**
 * One line of a breakdown (a month's category, or a trip's category). Shared by every period
 * so months, trips and all-time read the same way. Sits on the ground; the parent draws hairlines.
 */
@Component({
  selector: 'app-breakdown-row',
  standalone: true,
  imports: [DecimalPipe, StripeComponent, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="w-full min-h-14 py-2.5 text-left cursor-pointer"
      [attr.aria-expanded]="expanded()"
      (click)="toggle.emit()"
    >
      <span class="flex items-baseline justify-between gap-3">
        <span class="flex min-w-0 items-baseline gap-2">
          @if (emoji()) {
            <span
              class="w-5 shrink-0 text-[13px] grayscale-[40%] transition-opacity duration-300"
              [class]="dimmed() ? 'opacity-25' : 'opacity-60'"
              aria-hidden="true"
            >
              {{ emoji() }}
            </span>
          }
          <span
            class="truncate text-[15px] font-medium transition-colors duration-300"
            [class]="dimmed() ? 'text-ink-2' : 'text-ink'"
            >{{ label() }}</span
          >
        </span>
        <span class="shrink-0 text-[13px] text-ink tabular-nums" appSensitive="xs">
          €{{ amount() | number: '1.2-2' }}
          @if (budget() !== null) {
            <span class="text-ink-3">/ €{{ budget() | number: '1.2-2' }}</span>
          }
        </span>
      </span>

      <app-stripe
        class="mt-1 transition-opacity duration-300"
        [class.ml-7]="!!emoji()"
        [class.opacity-35]="dimmed()"
        [ratio]="ratio()"
        [tone]="tone() === 'share' || tone() === 'none' ? 'muted' : 'normal'"
      />

      <span
        class="flex items-center justify-between gap-3 text-[12px]"
        [class.ml-7]="!!emoji()"
      >
        <span [class]="statusClass()" appSensitive="xs">{{ statusText() }}</span>
        <span class="flex shrink-0 items-center gap-1 text-ink-3">
          {{ meta() }}
          <svg
            class="size-3.5 transition-transform duration-200"
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
        </span>
      </span>
    </button>

    @if (expanded()) {
      <div class="pb-3" [class.pl-7]="!!emoji()">
        <ng-content />
      </div>
    }
  `,
})
export class BreakdownRowComponent {
  readonly label = input.required<string>();
  readonly emoji = input<string | null>(null);
  readonly amount = input.required<number>();
  readonly budget = input<number | null>(null);
  /** Fill of the stripe, on the row's fixed scale (amount ÷ budget, or share of the total). */
  readonly ratio = input(0);
  readonly tone = input<RowTone>('ok');
  readonly statusText = input('');
  readonly meta = input('');
  readonly expanded = input(false);
  readonly dimmed = input(false);

  readonly toggle = output<void>();

  readonly statusClass = computed(() => {
    switch (this.tone()) {
      case 'over':
        return 'font-semibold text-cherry';
      case 'ahead':
        return 'font-semibold text-ember-ink';
      case 'ok':
        return 'text-avocado';
      case 'full':
        return 'text-ink-2';
      default:
        return 'text-ink-3';
    }
  });
}
