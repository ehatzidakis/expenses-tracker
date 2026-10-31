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
  PICKER_WRAPPER,
  PILL_BASE,
  QUICK_PILL,
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
      <!-- Singles: standalone pill -->
      <button
        type="button"
        data-testid="singles-pill"
        (click)="onSelect(null)"
        [class]="pillBase + ' ' + (selectedId() === null ? activePill : idlePill)"
        [attr.aria-pressed]="selectedId() === null"
      >
        Singles
      </button>

      @if (quickTrips().length) {
        <span class="w-px self-stretch my-1 bg-gray-800 shrink-0" aria-hidden="true"></span>

        <!-- Recent trips: separate pills laid out directly in the row -->
        <div role="group" aria-label="Recent trips" class="contents">
          @for (trip of quickTrips(); track trip.id) {
            <button
              type="button"
              data-testid="trip-pill"
              (click)="onSelect(trip.id)"
              [class]="quickPill + ' ' + (selectedId() === trip.id ? activePill : idlePill)"
              [attr.aria-pressed]="selectedId() === trip.id"
              [attr.title]="trip.title"
            >
              <span class="text-[10px] opacity-70" aria-hidden="true">✈</span>
              <span data-testid="trip-pill-title">{{ trip.title }}</span>
            </button>
          }
        </div>
      }

      @if (showPicker()) {
        <div [class]="pickerWrapper">
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
              class="absolute right-0 top-full mt-2 z-20 w-64 bg-gray-900 border border-gray-800 rounded-2xl p-3 shadow-xl"
            >
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  data-testid="prev-year"
                  (click)="prevYear()"
                  [disabled]="!prevYearValue()"
                  aria-label="Previous year"
                  class="w-8 h-8 rounded-lg text-gray-300 hover:bg-gray-800 disabled:text-gray-700 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                <span data-testid="view-year" class="text-sm font-medium text-gray-100">
                  {{ viewYear() }}
                </span>
                <button
                  type="button"
                  data-testid="next-year"
                  (click)="nextYear()"
                  [disabled]="!nextYearValue()"
                  aria-label="Next year"
                  class="w-8 h-8 rounded-lg text-gray-300 hover:bg-gray-800 disabled:text-gray-700 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  ›
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                    "
                    class="w-full text-left px-3 py-2 rounded-xl transition-colors duration-150"
                  >
                    <span class="block text-xs font-medium truncate">{{ trip.title }}</span>
                    <span
                      class="block text-[10px] mt-0.5"
                      [class]="selectedId() === trip.id ? 'text-indigo-200' : 'text-gray-500'"
                    >
                      {{ trip.startDate | date: 'dd/MM' }} – {{ trip.endDate | date: 'dd/MM/yyyy' }}
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
    <!-- <div class="h-px mt-4 bg-gray-800" aria-hidden="true"></div> -->
  `,
})
export class AdjustmentSelectorComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Expected newest-first by startDate. */
  adjustments = input.required<Adjustment[]>();
  selectedId = input<string | null>(null);

  selectionChanged = output<string | null>();

  protected readonly pillBase = PILL_BASE;
  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;
  protected readonly quickPill = QUICK_PILL;
  protected readonly pickerWrapper = PICKER_WRAPPER;
  protected readonly pickerBase = PICKER_BASE;
  protected readonly pickerActive = PICKER_ACTIVE;
  protected readonly pickerIdle = PICKER_IDLE;
  protected readonly calendarIcon = CALENDAR_ICON_PATH;

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
