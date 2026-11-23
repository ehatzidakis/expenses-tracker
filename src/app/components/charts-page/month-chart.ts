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
/** Surface gap between a column and its over-budget cap; the budget line shows through it. */
const GAP = 2;
/** An over-budget cap never drawn thinner than this, so a few euros over still shows. */
const MIN_CAP = 3;

/** What the columns measure: money spent (against the budget) or money kept (wage − spent). */
export type MonthChartMode = 'spent' | 'saved';

interface Segment {
  path: string;
  fill: string;
  opacity: number;
}

/**
 * One column per month on a single € axis. Spending: ember columns with the budget as one
 * line, and only the part above that line in cherry. Saving: wage minus spending, avocado above
 * a zero line and cherry below it. Tapping a column selects that month.
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
        class="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        (scroll)="onScroll($event)"
      >
        <svg
          [attr.width]="width()"
          [attr.height]="height"
          [attr.viewBox]="'0 0 ' + width() + ' ' + height"
          class="block overflow-visible"
          role="group"
          [attr.aria-label]="mode() === 'spent' ? 'Spending per month' : 'Saved per month'"
        >
          <!-- € gridlines -->
          @for (tick of ticks(); track tick.value) {
            @if (tick.value !== 0) {
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
          }

          <!-- The one reference line: the budget, or zero when saving -->
          @if (referenceY(); as y) {
            <line
              [attr.x1]="pad.left"
              [attr.x2]="width() - pad.right"
              [attr.y1]="y"
              [attr.y2]="y"
              [class]="mode() === 'spent' ? 'stroke-ink-3' : 'stroke-ink/30'"
              stroke-width="1"
              shape-rendering="crispEdges"
            />
          }

          @for (bar of bars(); track bar.id) {
            @for (segment of bar.segments; track $index) {
              <path
                [attr.d]="segment.path"
                [class]="segment.fill"
                [attr.opacity]="segment.opacity"
                class="transition-opacity duration-150"
              />
            }
            @if (bar.selected) {
              <text
                [attr.x]="bar.labelX"
                [attr.y]="bar.labelY"
                text-anchor="middle"
                class="fill-ink-2 stroke-ground text-[11px] font-medium tabular-nums [paint-order:stroke]"
                stroke-width="3"
                appSensitive="xs"
              >
                {{ bar.valueLabel }}
              </text>
            }
            <text
              [attr.x]="bar.cx"
              [attr.y]="height - 21"
              text-anchor="middle"
              class="text-[11px]"
              [class]="bar.selected ? 'fill-ink font-semibold' : 'fill-ink-3'"
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

    <!-- Key: what the lines and colours mean, outside the plot so nothing collides there -->
    <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-3">
      @if (mode() === 'spent') {
        @if (budget() > 0) {
          <span class="flex items-center gap-1.5">
            <span class="h-px w-3.5 bg-ink-3" aria-hidden="true"></span>
            <span appSensitive="xs">Budget €{{ budget() | number: '1.0-0' }}</span>
          </span>
        }
        @if (anyNegative()) {
          <span class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-[2px] bg-cherry-fill" aria-hidden="true"></span>Over budget
          </span>
        }
      } @else {
        <span class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-[2px] bg-avocado" aria-hidden="true"></span>Kept from the wage
        </span>
        @if (anyNegative()) {
          <span class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-[2px] bg-cherry-fill" aria-hidden="true"></span>Spent more than the wage
          </span>
        }
      }
    </p>

    <table class="sr-only">
      <caption>{{ mode() === 'spent' ? 'Spending per month' : 'Saved per month' }}</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Spent</th>
          <th scope="col">Budget</th>
          <th scope="col">Wage</th>
          <th scope="col">Saved</th>
        </tr>
      </thead>
      <tbody>
        @for (m of months(); track m.id) {
          <tr>
            <th scope="row">{{ m.monthName }}{{ m.current ? ' (so far)' : '' }}</th>
            <td appSensitive="xs">€{{ m.spent | number: '1.2-2' }}</td>
            <td appSensitive="xs">€{{ m.budget | number: '1.2-2' }}</td>
            <td appSensitive="xs">€{{ m.wage | number: '1.2-2' }}</td>
            <td appSensitive="xs">{{ m.saved < 0 ? '−' : '' }}€{{ abs(m.saved) | number: '1.2-2' }}</td>
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
  readonly mode = input<MonthChartMode>('spent');
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

  /** Budgets are not stored per month, so every month shares today's. */
  readonly budget = computed(() => this.months()[0]?.budget ?? 0);

  /** The value each column stands for. */
  private value(m: MonthTotal): number {
    return this.mode() === 'spent' ? m.spent : m.saved;
  }

  /** Any month in the red: over budget when spending, below zero when saving. */
  readonly anyNegative = computed(() =>
    this.mode() === 'spent'
      ? this.months().some((m) => this.budget() > 0 && m.spent > this.budget() + 0.005)
      : this.months().some((m) => m.saved < -0.005),
  );

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

  private readonly x = computed(() =>
    scaleBand<string>()
      .domain(this.months().map((m) => m.id))
      .range([PAD.left, this.width() - PAD.right])
      .paddingInner(0)
      .paddingOuter(0.05),
  );

  private readonly y = computed(() => {
    const values = this.months().map((m) => this.value(m));
    const reference = this.mode() === 'spent' ? [this.budget()] : [];
    const hi = Math.max(1, ...values, ...reference);
    const lo = Math.min(0, ...values);
    const room = (hi - lo) * 0.04;
    return scaleLinear()
      .domain([lo < 0 ? lo - room : 0, hi + room])
      .range([HEIGHT - PAD.bottom, PAD.top])
      .nice(3);
  });

  readonly ticks = computed(() => {
    const y = this.y();
    return y.ticks(3).map((value) => ({
      value,
      y: Math.round(y(value)) + 0.5,
      label: euroTick(value),
    }));
  });

  /** The budget line when spending; the zero line when saving. */
  readonly referenceY = computed(() => {
    if (this.mode() === 'saved') return Math.round(this.y()(0)) + 0.5;
    return this.budget() > 0 ? Math.round(this.y()(this.budget())) + 0.5 : null;
  });

  readonly bars = computed(() => {
    const x = this.x();
    const y = this.y();
    const mode = this.mode();
    const budget = this.budget();
    const slotW = x.bandwidth();
    const barW = Math.min(24, Math.max(6, slotW * 0.62));
    const zero = y(0);
    const selectedIndex = this.selectedIndex();
    const months = this.months();

    return months.map((m, i) => {
      const slotX = x(m.id) ?? 0;
      const cx = slotX + slotW / 2;
      const left = cx - barW / 2;
      const selected = i === selectedIndex;
      const value = this.value(m);
      const end = y(value);
      const segments: Segment[] = [];

      if (mode === 'spent') {
        const over = budget > 0 && m.spent > budget + 0.005;
        const fill = { path: '', fill: 'fill-ember', opacity: selected ? 1 : 0.5 };
        if (!over) {
          segments.push({ ...fill, path: column(left, end, barW, zero - end, 'up') });
        } else {
          // Ember up to the budget, a gap the budget line shows through, cherry for the excess.
          const line = y(budget);
          const capTop = Math.min(end, line - GAP / 2 - MIN_CAP);
          segments.push({ ...fill, path: rect(left, line + GAP / 2, barW, zero - line - GAP / 2) });
          segments.push({
            path: column(left, capTop, barW, line - GAP / 2 - capTop, 'up'),
            fill: selected ? 'fill-cherry' : 'fill-cherry-fill',
            opacity: selected ? 1 : 0.85,
          });
        }
      } else if (value >= 0) {
        segments.push({
          path: column(left, end, barW, zero - end, 'up'),
          fill: 'fill-avocado',
          // Avocado is darker than ember, so it needs more than 50% to stay green, not olive.
          opacity: selected ? 1 : 0.65,
        });
      } else {
        segments.push({
          path: column(left, zero, barW, end - zero, 'down'),
          fill: selected ? 'fill-cherry' : 'fill-cherry-fill',
          opacity: selected ? 1 : 0.85,
        });
      }

      const top = Math.min(zero, end);
      const bottom = Math.max(zero, end);
      const valueLabel =
        mode === 'saved' && value < 0
          ? `−€${Math.round(-value).toLocaleString('en-US')}`
          : `€${Math.round(value).toLocaleString('en-US')}`;
      // Keep the label inside the plot: the newest month sits against the right edge.
      const half = valueLabel.length * 3.3 + 2;
      // The selected value sits past the end of its column: above, or below one that dips.
      let labelY = mode === 'saved' && value < 0 ? Math.min(bottom + 13, HEIGHT - PAD.bottom + 2) : top - 6;
      // A column ending just under the budget would put its label on the line: lift it clear.
      const line = mode === 'spent' && budget > 0 ? y(budget) : null;
      if (line !== null && line > labelY - 11 && line < labelY + 4) labelY = line - 5;
      return {
        id: m.id,
        monthName: `${m.monthName}${m.current ? ', so far' : ''}`,
        selected,
        segments,
        cx,
        labelX: Math.min(Math.max(cx, PAD.left + half), this.width() - PAD.right - half),
        labelY,
        valueLabel,
        label: m.short,
        // The year only where it changes: under the first month and under each January.
        year: i === 0 || m.month === 0 ? `'${String(m.year).slice(-2)}` : '',
      };
    });
  });

  abs(value: number): number {
    return Math.abs(value);
  }

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

function euroTick(value: number): string {
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return `${sign}€${abs >= 10_000 ? `${abs / 1000}K` : abs.toLocaleString('en-US')}`;
}

/** A plain rectangle: the part of an over-budget column below the budget line. */
function rect(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return '';
  return `M${x},${y}H${x + w}V${y + h}H${x}Z`;
}

/**
 * A column with 4px rounded corners on its data end and a square foot on the baseline.
 * 'up' rounds the top (the column rises from the baseline); 'down' rounds the bottom.
 */
function column(x: number, y: number, w: number, h: number, direction: 'up' | 'down'): string {
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  if (direction === 'up') {
    return [
      `M${x},${y + h}`,
      `V${y + r}`,
      `Q${x},${y} ${x + r},${y}`,
      `H${x + w - r}`,
      `Q${x + w},${y} ${x + w},${y + r}`,
      `V${y + h}`,
      'Z',
    ].join(' ');
  }
  return [
    `M${x},${y}`,
    `V${y + h - r}`,
    `Q${x},${y + h} ${x + r},${y + h}`,
    `H${x + w - r}`,
    `Q${x + w},${y + h} ${x + w},${y + h - r}`,
    `V${y}`,
    'Z',
  ].join(' ');
}
