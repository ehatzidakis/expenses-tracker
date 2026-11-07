import { Component, computed, input } from '@angular/core';

/**
 * The budget bar used everywhere in the app. It fills to the share spent on one fixed scale
 * (0–100% of the budget). Rows can show a cream notch at today, marking where spending would
 * be if the budget were spent evenly through the month. The big month bar is thicker and carries
 * a label at each end instead: cream over the empty track, dark over the fill.
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
    /* The dark copy of the label is revealed with the fill, on the same curve. */
    .clip-in {
      animation: clip-in 700ms var(--ease-out-expo) both;
    }
    @keyframes clip-in {
      from {
        clip-path: inset(0 100% 0 0);
      }
    }
  `,
  template: `
    @if (startLabel() || endLabel()) {
      <div class="relative h-6 overflow-hidden rounded-full bg-ink/[0.07]">
        <!-- Square end, so the label changes colour exactly where the fill ends. -->
        <div
          class="h-full transition-[width] duration-500 ease-out"
          [class]="barColor()"
          [class.bar-in]="animate()"
          [style.width.%]="fill()"
        ></div>
        <!-- Same labels twice: cream on the track, dark clipped to the fill. -->
        <span class="absolute inset-0 text-ink-2" aria-hidden="true">
          <span [class]="labelClass + ' left-3'">{{ startLabel() }}</span>
          <span [class]="labelClass + ' right-3'">{{ endLabel() }}</span>
        </span>
        <span
          class="absolute inset-0 text-ground"
          [class.clip-in]="animate()"
          [style.clip-path]="'inset(0 ' + (100 - fill()) + '% 0 0)'"
          aria-hidden="true"
        >
          <span [class]="labelClass + ' left-3'">{{ startLabel() }}</span>
          <span [class]="labelClass + ' right-3'">{{ endLabel() }}</span>
        </span>
      </div>
    } @else {
      <div class="relative" [class]="size() === 'lg' ? 'py-1.5' : 'py-1'">
        <div class="w-full rounded-full bg-ink/[0.07]" [class]="size() === 'lg' ? 'h-2' : 'h-1'">
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
    }
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
  /** Text at the left and right ends of a thick bar, e.g. "Sat 7th Nov" and "24 days left". */
  readonly startLabel = input('');
  readonly endLabel = input('');
  /** Grow in on first render. Kept for the one headline bar so rows stay at rest. */
  readonly animate = input(false);

  readonly fill = computed(() => Math.max(0, Math.min(1, this.ratio())) * 100);

  readonly notch = computed(() => {
    const pace = this.pace();
    if (pace === null || pace <= 0 || pace >= 1) return null;
    return pace * 100;
  });

  protected readonly labelClass =
    'absolute top-1/2 block max-w-[calc(50%-16px)] -translate-y-1/2 truncate whitespace-nowrap text-[11px] font-semibold leading-none tabular-nums';

  readonly barColor = computed(() => {
    const tone = this.ratio() > 1.00005 ? 'over' : this.tone();
    if (tone === 'over') return 'bg-cherry';
    if (tone === 'muted') return 'bg-ink-4';
    return 'bg-ember';
  });
}
