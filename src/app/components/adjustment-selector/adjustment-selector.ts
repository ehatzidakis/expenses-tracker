import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import type { Adjustment } from '../../models/adjustments.model';
import {
  ACTIVE_PILL,
  CALENDAR_ICON_PATH,
  CHEVRON_LEFT_PATH,
  CHEVRON_RIGHT_PATH,
  IDLE_PILL,
  PAGER_BUTTON,
  PAGER_BUTTON_OPEN,
  PAGER_PILLS,
  PAGER_ROW,
  PICKER_PANEL,
  QUICK_PILL,
  QUICK_PILL_GROW,
} from '../../utils/pill-styles';
import { PAGER_SIZE, followWindow, windowStartAt } from '../../utils/pager-window';

/**
 * Trip pager: newer arrow, three trips (the selected one keeps its whole name), a calendar of
 * every trip by year, and an older arrow.
 */
@Component({
  selector: 'app-adjustment-selector',
  standalone: true,
  imports: [DatePipe],
  host: {
    class: 'block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closePicker()',
  },
  template: `
    <section [class]="pagerRow">
      <button
        type="button"
        data-testid="trip-newer"
        aria-label="Newer trip"
        [class]="pagerButton"
        [disabled]="selectedIndex() <= 0"
        (click)="step(-1)"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="chevronLeft" />
        </svg>
      </button>

      <div role="group" aria-label="Trips" [class]="pagerPills">
        @for (trip of visibleTrips(); track trip.id) {
          <button
            type="button"
            data-testid="trip-pill"
            (click)="onSelect(trip.id)"
            [class]="
              selectedId() === trip.id
                ? quickPillGrow + ' ' + activePill
                : quickPill + ' ' + idlePill
            "
            [attr.aria-pressed]="selectedId() === trip.id"
            [attr.title]="trip.title"
          >
            <span data-testid="trip-pill-title">{{ trip.title }}</span>
          </button>
        }
      </div>

      @if (showPicker()) {
        <div class="flex shrink-0">
          <button
            type="button"
            data-testid="trip-picker-toggle"
            aria-label="Pick a trip"
            (click)="togglePicker()"
            [class]="pickerOpen() ? pagerButtonOpen : pagerButton"
            aria-haspopup="dialog"
            [attr.aria-expanded]="pickerOpen()"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="calendarIcon" />
            </svg>
          </button>

          @if (pickerOpen()) {
            <div
              role="dialog"
              aria-label="Pick a trip"
              data-testid="trip-picker"
              [class]="pickerPanel"
            >
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  data-testid="prev-year"
                  (click)="prevYear()"
                  [disabled]="!prevYearValue()"
                  aria-label="Previous year"
                  class="flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-raised-hi disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="chevronLeft" />
                  </svg>
                </button>
                <span data-testid="view-year" class="text-sm font-medium text-ink">
                  {{ viewYear() }}
                </span>
                <button
                  type="button"
                  data-testid="next-year"
                  (click)="nextYear()"
                  [disabled]="!nextYearValue()"
                  aria-label="Next year"
                  class="flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-raised-hi disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="chevronRight" />
                  </svg>
                </button>
              </div>

              <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                @for (trip of tripsInViewYear(); track trip.id) {
                  <button
                    type="button"
                    data-testid="trip-item"
                    (click)="pick(trip.id)"
                    [attr.aria-pressed]="selectedId() === trip.id"
                    [class]="
                      selectedId() === trip.id
                        ? 'bg-ember text-ground'
                        : 'bg-raised-hi/70 text-ink-2 hover:bg-raised-hi hover:text-ink'
                    "
                    class="w-full min-h-11 text-left px-3 py-2 rounded-xl transition-colors duration-150 cursor-pointer"
                  >
                    <span class="block text-[13px] font-medium truncate">{{ trip.title }}</span>
                    <span
                      class="block text-[12px] mt-0.5"
                      [class]="selectedId() === trip.id ? 'text-ground/75' : 'text-ink-3'"
                    >
                      {{ trip.startDate | date: 'd MMM' }} – {{ trip.endDate | date: 'd MMM y' }}
                    </span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <button
        type="button"
        data-testid="trip-older"
        aria-label="Older trip"
        [class]="pagerButton"
        [disabled]="selectedIndex() >= tripAdjustments().length - 1"
        (click)="step(1)"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="chevronRight" />
        </svg>
      </button>
    </section>
  `,
})
export class AdjustmentSelectorComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Expected newest-first by startDate. */
  adjustments = input.required<Adjustment[]>();
  selectedId = input<string | null>(null);

  selectionChanged = output<string>();

  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;
  protected readonly quickPill = QUICK_PILL;
  protected readonly quickPillGrow = QUICK_PILL_GROW;
  protected readonly pagerRow = PAGER_ROW;
  protected readonly pagerPills = PAGER_PILLS;
  protected readonly pagerButton = PAGER_BUTTON;
  protected readonly pagerButtonOpen = PAGER_BUTTON_OPEN;
  protected readonly chevronLeft = CHEVRON_LEFT_PATH;
  protected readonly chevronRight = CHEVRON_RIGHT_PATH;
  protected readonly calendarIcon = CALENDAR_ICON_PATH;
  protected readonly pickerPanel = PICKER_PANEL;

  readonly pickerOpen = signal(false);
  readonly viewYear = signal(new Date().getFullYear());

  readonly tripAdjustments = computed(() => this.adjustments().filter((a) => a.isTrip));

  /** Trips are newest-first, so index 0 is the latest trip. */
  readonly selectedIndex = computed(() =>
    this.tripAdjustments().findIndex((t) => t.id === this.selectedId()),
  );

  /** First of the three visible trips. Follows the selection; a calendar pick sets it directly. */
  readonly windowStart = linkedSignal<{ index: number; count: number }, number>({
    source: () => ({ index: this.selectedIndex(), count: this.tripAdjustments().length }),
    computation: ({ index, count }, previous) =>
      previous ? followWindow(previous.value, index, count) : windowStartAt(index, count),
  });

  readonly visibleTrips = computed(() =>
    this.tripAdjustments().slice(this.windowStart(), this.windowStart() + PAGER_SIZE),
  );

  readonly showPicker = computed(() => this.tripAdjustments().length > PAGER_SIZE);

  /** Years that have at least one trip, newest first. */
  readonly tripYears = computed(() =>
    [...new Set(this.tripAdjustments().map((t) => t.startDate.getFullYear()))].sort(
      (a, b) => b - a,
    ),
  );

  readonly tripsInViewYear = computed(() =>
    this.tripAdjustments().filter((t) => t.startDate.getFullYear() === this.viewYear()),
  );

  // Step only between years that have trips, so the list is never empty.
  readonly prevYearValue = computed(
    () => this.tripYears().find((y) => y < this.viewYear()) ?? null,
  );
  readonly nextYearValue = computed(
    () => [...this.tripYears()].reverse().find((y) => y > this.viewYear()) ?? null,
  );

  onSelect(id: string): void {
    this.closePicker();
    this.selectionChanged.emit(id);
  }

  /** Steps the selection one trip newer (-1) or older (+1). */
  step(direction: -1 | 1): void {
    const next = this.tripAdjustments()[this.selectedIndex() + direction];
    if (next) this.onSelect(next.id);
  }

  /** A calendar pick leads the row, followed by the two trips before it. */
  pick(id: string): void {
    const index = this.tripAdjustments().findIndex((t) => t.id === id);
    this.windowStart.set(windowStartAt(index, this.tripAdjustments().length));
    this.onSelect(id);
  }

  togglePicker(): void {
    if (this.pickerOpen()) {
      this.closePicker();
      return;
    }

    const selected = this.tripAdjustments().find((t) => t.id === this.selectedId());
    this.viewYear.set(selected?.startDate.getFullYear() ?? this.tripYears()[0]);
    this.pickerOpen.set(true);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  prevYear(): void {
    const year = this.prevYearValue();
    if (year !== null) this.viewYear.set(year);
  }

  nextYear(): void {
    const year = this.nextYearValue();
    if (year !== null) this.viewYear.set(year);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.pickerOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closePicker();
    }
  }
}
