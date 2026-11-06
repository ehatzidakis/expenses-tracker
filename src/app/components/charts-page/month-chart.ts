import { DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { scaleBand, scaleLinear } from 'd3-scale';
import { MonthTotal } from '../../utils/chart-data';
import { SensitiveDirective } from '../../utils/sensitive.directive';

const HEIGHT = 206;
const PAD = { top: 22, right: 4, bottom: 36, left: 0 };
/** Narrowest slot a month may get before the chart scrolls sideways. */
const MIN_SLOT = 24;
/** The € tick labels sit in their own column so they stay put while the months scroll. */
const AXIS_W = 44;

/**
 * Spending per month as columns on one € axis, with the total budget as a line and each
 * month's wage as a short mark. Tapping a column selects that month.
 */
@Component({
  selector: 'app-month-chart',
  standalone: true,
  imports: [DecimalPipe, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="relative flex">
    <div class="relative shrink-0" [style.width.px]="axisW" [style.height.px]="height" aria-hidden="true">
      @for (tick of ticks(); track tick.value) {
        <span
          class="absolute right-2 -translate-y-1/2 text-[11px] leading-none text-ink-3 tabular-nums"
          [style.top.px]="tick.y"
          appSensitive="xs"
          >{{ tick.label }}</span
        >
      }
    </div>
    <div
      #scroller
      class="-mr-4 min-w-0 flex-1 overflow-x-auto pr-4 [scrollbar-width:none] sm:mr-0 sm:pr-0"
      (scroll)="onScroll($event)"
    >
      <svg
        [attr.width]="width()"
        [attr.height]="height"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height"
        class="block overflow-visible"
        role="group"
        aria-label="Spending per month"
      >
        <!-- Gridlines and € ticks -->
        @for (tick of ticks(); track tick.value) {
          <line
            [attr.x1]="pad.left"
            [attr.x2]="width() - pad.right"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
            class="stroke-ink/10"
            stroke-width="1"
            shape-rendering="crispEdges"
          />
        }

        <!-- Budget: one line, since budgets are the same for every month -->
        @if (budgetY(); as y) {
          <line
            [attr.x1]="pad.left"
            [attr.x2]="width() - pad.right"
            [attr.y1]="y"
            [attr.y2]="y"
            class="stroke-ink-3"
            stroke-width="1"
            shape-rendering="crispEdges"
          />
        }

        @if (budgetY(); as y) {
          <text
            [attr.x]="width() - pad.right"
            [attr.y]="y - 5"
            text-anchor="end"
            class="fill-ink-3 stroke-ground text-[11px] [paint-order:stroke]"
            stroke-width="3"
            appSensitive="xs"
          >
            Budget €{{ months()[0]?.budget | number: '1.0-0' }}
          </text>
        }
        @if (wageLabel(); as wage) {
          <text
            [attr.x]="width() - pad.right"
            [attr.y]="wage.y - 6"
            text-anchor="end"
            class="fill-avocado-ink stroke-ground text-[11px] [paint-order:stroke]"
            stroke-width="3"
            appSensitive="xs"
          >
            Wage €{{ wage.value | number: '1.0-0' }}
          </text>
        }

        @for (bar of bars(); track bar.id) {
          <!-- Wage for that month -->
          @if (bar.wageY !== null) {
            <line
              [attr.x1]="bar.slotX + 2"
              [attr.x2]="bar.slotX + bar.slotW - 2"
              [attr.y1]="bar.wageY"
              [attr.y2]="bar.wageY"
              class="stroke-avocado"
              stroke-width="2"
              stroke-linecap="round"
            />
          }
          <!-- Dimmed when not selected; an over-budget month stays solid red so it never reads as ember -->
          <path
            [attr.d]="bar.path"
            [class]="bar.over ? (bar.id === selectedId() ? 'fill-cherry' : 'fill-cherry-fill') : 'fill-ember'"
            [attr.opacity]="bar.over || bar.id === selectedId() ? 1 : 0.5"
            class="transition-opacity duration-150"
          />
          @if (bar.id === selectedId()) {
            <text
              [attr.x]="bar.cx"
              [attr.y]="bar.top - 6"
              text-anchor="middle"
              class="fill-ink-2 text-[11px] font-medium tabular-nums"
              appSensitive="xs"
            >
              €{{ bar.spent | number: '1.0-0' }}
            </text>
          }
          <text
            [attr.x]="bar.cx"
            [attr.y]="height - 21"
            text-anchor="middle"
            class="text-[11px]"
            [class]="bar.id === selectedId() ? 'fill-ink font-semibold' : 'fill-ink-3'"
          >
            {{ bar.label }}
          </text>
          @if (bar.year) {
            <text [attr.x]="bar.cx" [attr.y]="height - 7" text-anchor="middle" class="fill-ink-3 text-[11px]">
              {{ bar.year }}
            </text>
          }
        }

        <!-- One pointer surface over the plot: a tap anywhere picks the nearest month, so the
             target is the whole chart, not a 24px slot. Keyboard: one stop, arrows move. -->
        <rect
          [attr.x]="0"
          [attr.y]="0"
          [attr.width]="width()"
          [attr.height]="height"
          fill="transparent"
          class="cursor-pointer outline-none focus-visible:stroke-ember"
          stroke-width="2"
          [style.touch-action]="scrolls() ? 'pan-x pan-y' : 'pan-y'"
          tabindex="0"
          role="slider"
          aria-label="Month"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="months().length - 1"
          [attr.aria-valuenow]="selectedIndex()"
          [attr.aria-valuetext]="bars()[selectedIndex()]?.monthName"
          (pointerdown)="startScrub($event)"
          (pointermove)="scrub($event)"
          (pointerup)="endScrub($event)"
          (pointercancel)="cancelScrub()"
          (keydown)="onKey($event)"
        />
      </svg>
    </div>
    @if (olderHidden()) {
      <div
        class="pointer-events-none absolute top-0 w-7 bg-linear-to-r from-ground to-transparent"
        [style.left.px]="axisW"
        [style.height.px]="height - pad.bottom"
        aria-hidden="true"
      ></div>
    }
    </div>

    @if (anyOver()) {
      <p class="mt-2 flex items-center gap-1.5 text-[12px] text-ink-3">
        <span class="size-2.5 rounded-[2px] bg-cherry-fill" aria-hidden="true"></span>Red months went over budget
      </p>
    }

    <table class="sr-only">
      <caption>Spending per month</caption>
      <thead>
        <tr><th scope="col">Month</th><th scope="col">Spent</th><th scope="col">Budget</th><th scope="col">Wage</th></tr>
      </thead>
      <tbody>
        @for (m of months(); track m.id) {
          <tr>
            <th scope="row">{{ m.monthName }}{{ m.current ? ' (so far)' : '' }}</th>
            <td appSensitive="xs">€{{ m.spent | number: '1.2-2' }}</td>
            <td appSensitive="xs">€{{ m.budget | number: '1.2-2' }}</td>
            <td appSensitive="xs">€{{ m.wage | number: '1.2-2' }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class MonthChartComponent {
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  protected readonly axisW = AXIS_W;

  readonly months = input.required<MonthTotal[]>();
  readonly selectedId = input<string | null>(null);
  readonly select = output<string>();

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private readonly containerWidth = signal(358);

  readonly width = computed(() =>
    Math.max(this.containerWidth(), this.months().length * MIN_SLOT + PAD.left + PAD.right),
  );

  readonly selectedIndex = computed(() => {
    const i = this.months().findIndex((m) => m.id === this.selectedId());
    return i === -1 ? this.months().length - 1 : i;
  });

  /** The newest month's wage, labelled once at the right end. */
  readonly wageLabel = computed(() => {
    const last = this.months()[this.months().length - 1];
    return last && last.wage > 0 ? { value: last.wage, y: this.y()(last.wage) } : null;
  });

  /** True once older months have scrolled off to the left. */
  readonly olderHidden = signal(false);

  onScroll(event: Event): void {
    this.olderHidden.set((event.target as HTMLElement).scrollLeft > 4);
  }

  /** True when the months are wider than the screen, so sideways drags scroll instead of scrub. */
  readonly scrolls = computed(() => this.width() > this.containerWidth() + 1);

  private press: { x: number; y: number } | null = null;
  private scrubbing = false;

  /**
   * Nothing is picked on press: the browser doesn't know yet whether the touch is a tap or a
   * page scroll. A tap picks on release; a deliberate sideways slide (6M/12M) scrubs; a scroll
   * ends in pointercancel and leaves the selection alone.
   */
  startScrub(event: PointerEvent): void {
    this.press = { x: event.clientX, y: event.clientY };
    this.scrubbing = false;
  }

  scrub(event: PointerEvent): void {
    if (!this.press || this.scrolls()) return;
    if (!this.scrubbing) {
      const dx = Math.abs(event.clientX - this.press.x);
      const dy = Math.abs(event.clientY - this.press.y);
      if (dx < 6 || dx < dy + 6) return;
      this.scrubbing = true;
      (event.target as Element).setPointerCapture?.(event.pointerId);
    }
    this.pickAt(event);
  }

  endScrub(event: PointerEvent): void {
    if (!this.press) return;
    const moved = Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y);
    if (!this.scrubbing && moved < 10) this.pickAt(event);
    this.cancelScrub();
  }

  cancelScrub(): void {
    this.press = null;
    this.scrubbing = false;
  }

  pickAt(event: MouseEvent): void {
    const svg = (event.target as SVGElement).ownerSVGElement;
    if (!svg) return;
    const x = event.clientX - svg.getBoundingClientRect().left;
    let best = this.bars()[0];
    for (const bar of this.bars()) {
      if (Math.abs(bar.cx - x) < Math.abs(best.cx - x)) best = bar;
    }
    if (best && best.id !== this.selectedId()) this.select.emit(best.id);
  }

  onKey(event: KeyboardEvent): void {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    const months = this.months();
    let next = this.selectedIndex() + step;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = months.length - 1;
    if (next === this.selectedIndex() || next < 0 || next >= months.length) return;
    event.preventDefault();
    this.select.emit(months[next].id);
  }

  readonly anyOver = computed(() => this.months().some((m) => m.budget > 0 && m.spent > m.budget + 0.005));

  private readonly x = computed(() =>
    scaleBand<string>()
      .domain(this.months().map((m) => m.id))
      .range([PAD.left, this.width() - PAD.right])
      .paddingInner(0)
      .paddingOuter(0.05),
  );

  private readonly y = computed(() => {
    const peak = Math.max(1, ...this.months().flatMap((m) => [m.spent, m.budget, m.wage]));
    return scaleLinear()
      .domain([0, peak * 1.04])
      .range([HEIGHT - PAD.bottom, PAD.top])
      .nice(3);
  });

  readonly ticks = computed(() => {
    const y = this.y();
    return y.ticks(3).map((value) => ({
      value,
      y: Math.round(y(value)) + 0.5,
      label: value >= 10_000 ? `€${value / 1000}K` : `€${value.toLocaleString('en-US')}`,
    }));
  });

  readonly budgetY = computed(() => {
    const budget = this.months()[0]?.budget ?? 0;
    return budget > 0 ? Math.round(this.y()(budget)) + 0.5 : null;
  });

  readonly bars = computed(() => {
    const x = this.x();
    const y = this.y();
    const slotW = x.bandwidth();
    const barW = Math.min(24, Math.max(6, slotW * 0.62));
    const base = HEIGHT - PAD.bottom;
    const months = this.months();
    const seen = new Map<number, number>();
    months.forEach((m) => seen.set(m.month, (seen.get(m.month) ?? 0) + 1));
    const repeats = new Set([...seen].filter(([, n]) => n > 1).map(([month]) => month));
    return months.map((m, i) => {
      const slotX = x(m.id) ?? 0;
      const cx = slotX + slotW / 2;
      const top = Math.min(base, y(m.spent));
      return {
        id: m.id,
        monthName: `${m.monthName}${m.current ? ', so far' : ''}`,
        spent: m.spent,
        over: m.budget > 0 && m.spent > m.budget + 0.005,
        slotX,
        slotW,
        cx,
        top,
        path: roundedTop(cx - barW / 2, top, barW, base - top, 4),
        wageY: m.wage > 0 ? y(m.wage) : null,
        label: m.short,
        year:
          (i === 0 && months.length > 1) || m.month === 0 || repeats.has(m.month)
            ? `'${String(m.year).slice(-2)}`
            : '',
      };
    });
  });

  constructor() {
    afterNextRender(() => {
      const el = this.scroller().nativeElement;
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        this.containerWidth.set(Math.max(240, Math.floor(entry.contentRect.width)));
      });
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    // Newest month sits at the right: jump there whenever the range (and so the width) changes.
    effect(() => {
      this.width();
      const el = this.scroller().nativeElement;
      requestAnimationFrame(() => (el.scrollLeft = el.scrollWidth));
    });
  }

  private readonly destroyRef = inject(DestroyRef);
}

/** A column with 4px rounded top corners and a square foot on the baseline. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return '';
  const radius = Math.min(r, w / 2, h);
  return [
    `M${x},${y + h}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `H${x + w - radius}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `V${y + h}`,
    'Z',
  ].join(' ');
}
