import { Component, computed, input } from '@angular/core';

/**
 * The budget bar used everywhere in the app. It fills to the share spent on one fixed scale
 * (0–100% of the budget). The big month bar also shows a cream notch at today, marking where
 * spending would be if the budget were spent evenly through the month.
 */
@Component({
  selector: 'app-stripe',
  standalone: true,
  host: {
    class: 'block',
    role: 'img',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  styles: `
    .bar-in {
      transform-origin: left center;
      animation: bar-in 700ms var(--ease-out-expo) both;
    }
    @keyframes bar-in {
      from {
        transform: scaleX(0);
      }
      to {
        transform: scaleX(1);
      }
    }
  `,
  template: `
    @if (notchLabel() && notch() !== null) {
      <div class="relative h-4" aria-hidden="true">
        <span
          class="absolute bottom-0 whitespace-nowrap text-[11px] leading-none text-ink-2"
          [style.left.%]="notch()"
          [style.transform]="labelShift()"
          >{{ notchLabel() }}</span
        >
      </div>
    }
    <div class="relative" [class]="size() === 'lg' ? 'py-1.5' : 'py-1'">
      <div
        class="w-full rounded-full bg-ink/[0.07]"
        [class]="size() === 'lg' ? 'h-2' : 'h-1'"
      >
        <div
          class="h-full rounded-full transition-[width] duration-500 ease-out"
          [class]="barColor()"
          [class.bar-in]="animate()"
          [style.width.%]="fill()"
        ></div>
      </div>

      @if (notch() !== null) {
        <span
          class="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_2px_var(--color-ground)]"
          [style.left.%]="notch()"
        ></span>
      }
    </div>
  `,
})
export class StripeComponent {
  /** Spent ÷ budget. Values above 1 fill the bar and turn it cherry. */
  readonly ratio = input(0);
  /** Share of the period gone by today (0–1), or null for no notch. */
  readonly pace = input<number | null>(null);
  readonly tone = input<'normal' | 'over' | 'muted'>('normal');
  readonly size = input<'lg' | 'sm'>('sm');
  /** Accessible description; the bar is decorative when empty. */
  readonly label = input('');
  /** Short caption above the notch, e.g. "Today". */
  readonly notchLabel = input('');
  /** Grow in on first render. Kept for the one headline bar so rows stay at rest. */
  readonly animate = input(false);

  readonly fill = computed(() => Math.max(0, Math.min(1, this.ratio())) * 100);

  readonly notch = computed(() => {
    const pace = this.pace();
    if (pace === null || pace <= 0 || pace >= 1) return null;
    return pace * 100;
  });

  /** Centre the caption on the notch, but keep it inside the bar near either end. */
  readonly labelShift = computed(() => {
    const at = this.notch() ?? 0;
    if (at < 8) return 'translateX(-2px)';
    if (at > 92) return 'translateX(calc(-100% + 2px))';
    return 'translateX(-50%)';
  });

  readonly barColor = computed(() => {
    const tone = this.ratio() > 1.00005 ? 'over' : this.tone();
    if (tone === 'over') return 'bg-cherry';
    if (tone === 'muted') return 'bg-ink-4';
    return 'bg-ember';
  });
}
