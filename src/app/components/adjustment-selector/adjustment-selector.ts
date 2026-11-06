import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { Adjustment } from '../../models/adjustments.model';
import {
  ACTIVE_PILL,
  CALENDAR_ICON_PATH,
  IDLE_PILL,
  PICKER_ACTIVE,
  PICKER_BASE,
  PICKER_IDLE,
  PICKER_PANEL,
  PICKER_WRAPPER,
  PILL_BASE,
  QUICK_PILL,
  QUICK_PILL_GROW,
} from '../../utils/pill-styles';

const QUICK_TRIPS = 2;

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
    <section class="flex items-center gap-2">
      @if (includeSingles()) {
        <!-- One-offs: standalone pill -->
        <button
          type="button"
          data-testid="singles-pill"
          (click)="onSelect(null)"
          [class]="pillBase + ' ' + (selectedId() === null ? activePill : idlePill)"
          [attr.aria-pressed]="selectedId() === null"
        >
          One-offs
        </button>
      }

      @if (quickTrips().length) {
        @if (includeSingles()) {
          <span class="w-px self-stretch my-1 bg-edge shrink-0" aria-hidden="true"></span>
        }

        <!-- Recent trips: separate pills laid out directly in the row -->
        <div role="group" aria-label="Recent trips" class="contents">
          @for (trip of quickTrips(); track trip.id) {
            <button
              type="button"
              data-testid="trip-pill"
              (click)="onSelect(trip.id)"
              [class]="selectedId() === trip.id ? quickPillGrow + ' ' + activePill : quickPill + ' ' + idlePill"
              [attr.aria-pressed]="selectedId() === trip.id"
              [attr.title]="trip.title"
            >
              <span data-testid="trip-pill-title">{{ trip.title }}</span>
            </button>
          }
        </div>
      }

      @if (showPicker()) {
        <div [class]="olderSelected() ? 'relative flex-none max-w-[60%]' : pickerWrapper">
          <button
            type="button"
            data-testid="trip-picker-toggle"
            (click)="togglePicker()"
            [class]="pickerBase + ' ' + (olderSelected() ? pickerActive : pickerIdle)"
            aria-haspopup="dialog"
            [attr.aria-expanded]="pickerOpen()"
            [attr.title]="olderSelected()?.title ?? null"
          >
            @if (!olderSelected()) {
              <svg
                class="w-3 h-3 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="calendarIcon" />
              </svg>
            }
            <span class="min-w-0 truncate">{{ olderSelected()?.title ?? 'More' }}</span>
            <svg
              class="w-3 h-3 shrink-0 transition-transform duration-150"
              [class.rotate-180]="pickerOpen()"
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
                  <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" /></svg>
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
                  <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" /></svg>
                </button>
              </div>

              <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                @for (trip of tripsInViewYear(); track trip.id) {
                  <button
                    type="button"
                    data-testid="trip-item"
                    (click)="onSelect(trip.id)"
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
    </section>

    <!-- Separates the trip navigation from the content below -->
    <!-- <div class="h-px mt-4 bg-raised" aria-hidden="true"></div> -->
  `,
})
export class AdjustmentSelectorComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Expected newest-first by startDate. */
  adjustments = input.required<Adjustment[]>();
  selectedId = input<string | null>(null);
  /** Show the standalone one-offs pill (off on the Budget page, where a switch handles it). */
  includeSingles = input(true);

  selectionChanged = output<string | null>();

  protected readonly pillBase = PILL_BASE;
  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;
  protected readonly quickPill = QUICK_PILL;
  protected readonly quickPillGrow = QUICK_PILL_GROW;
  protected readonly pickerWrapper = PICKER_WRAPPER;
  protected readonly pickerBase = PICKER_BASE;
  protected readonly pickerActive = PICKER_ACTIVE;
  protected readonly pickerIdle = PICKER_IDLE;
  protected readonly calendarIcon = CALENDAR_ICON_PATH;
  protected readonly pickerPanel = PICKER_PANEL;

  readonly pickerOpen = signal(false);
  readonly viewYear = signal(new Date().getFullYear());

  readonly tripAdjustments = computed(() => this.adjustments().filter((a) => a.isTrip));

  readonly quickTrips = computed(() => this.tripAdjustments().slice(0, QUICK_TRIPS));

  readonly showPicker = computed(() => this.tripAdjustments().length > QUICK_TRIPS);

  readonly olderSelected = computed<Adjustment | null>(() => {
    const id = this.selectedId();
    if (!id || this.quickTrips().some((t) => t.id === id)) return null;
    return this.tripAdjustments().find((t) => t.id === id) ?? null;
  });

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

  onSelect(id: string | null): void {
    this.closePicker();
    this.selectionChanged.emit(id);
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
