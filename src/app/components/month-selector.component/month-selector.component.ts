import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { Expense } from '../../models/expenses.model';
import {
  CALENDAR_ICON_PATH,
  PICKER_ACTIVE,
  PICKER_BASE,
  PICKER_CONNECTOR,
  PICKER_IDLE,
  SEGMENT,
  SEGMENT_ACTIVE,
  SEGMENT_GROUP,
  SEGMENT_IDLE,
} from '../../utils/pill-styles';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface ParsedMonth {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  monthIndex: number;
}

interface GridCell {
  name: string;
  short: string;
  id: string | null;
  selected: boolean;
}

const QUICK_COUNT = 3;

@Component({
  selector: 'app-month-selector',
  standalone: true,
  host: {
    class: 'block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closePicker()',
  },
  template: `
    <section class="flex items-center gap-2">
      <!-- Recent months: one segmented strip -->
      <div role="group" aria-label="Recent months" [class]="segmentGroup">
        @for (item of quickMonths(); track item.id) {
          <button
            type="button"
            data-testid="month-pill"
            (click)="onSelect(item.id)"
            [class]="segment + ' ' + (selectedId() === item.id ? segmentActive : segmentIdle)"
            [attr.aria-pressed]="selectedId() === item.id"
            [attr.aria-label]="item.label"
          >
            {{ item.shortLabel }}
          </button>
        }
      </div>

      @if (showPicker()) {
        <!-- Connector: links the recent months to the picker of older ones -->
        <span data-testid="month-connector" [class]="pickerConnector" aria-hidden="true"></span>

        <div class="relative shrink-0">
          <button
            type="button"
            data-testid="month-picker-toggle"
            (click)="togglePicker()"
            [class]="pickerBase + ' ' + (olderSelected() ? pickerActive : pickerIdle)"
            aria-haspopup="dialog"
            [attr.aria-expanded]="pickerOpen()"
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
            <span class="min-w-0 truncate">{{ olderSelected()?.shortLabel ?? 'More' }}</span>
            <svg
              class="w-3 h-3 transition-transform duration-150"
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
              aria-label="Pick a month"
              data-testid="month-picker"
              class="absolute right-0 top-full mt-2 z-20 w-64 bg-gray-900 border border-gray-800 rounded-2xl p-3 shadow-xl"
            >
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  data-testid="prev-year"
                  (click)="prevYear()"
                  [disabled]="viewYear() <= minYear()"
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
                  [disabled]="viewYear() >= maxYear()"
                  aria-label="Next year"
                  class="w-8 h-8 rounded-lg text-gray-300 hover:bg-gray-800 disabled:text-gray-700 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2">
                @for (cell of gridCells(); track cell.short) {
                  <button
                    type="button"
                    data-testid="month-cell"
                    (click)="cell.id && pick(cell.id)"
                    [disabled]="!cell.id"
                    [attr.aria-label]="cell.name + ' ' + viewYear()"
                    [attr.aria-pressed]="cell.selected"
                    [class]="
                      cell.selected
                        ? 'bg-indigo-600 text-white font-medium'
                        : cell.id
                          ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                          : 'text-gray-600 cursor-not-allowed'
                    "
                    class="py-2 rounded-xl text-xs transition-colors duration-150"
                  >
                    {{ cell.short }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class MonthSelectorComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  months = input.required<Expense[]>();
  selectedId = input<string | null>(null);
  monthSelected = output<string>();

  protected readonly segmentGroup = SEGMENT_GROUP;
  protected readonly segment = SEGMENT;
  protected readonly segmentActive = SEGMENT_ACTIVE;
  protected readonly segmentIdle = SEGMENT_IDLE;
  protected readonly pickerBase = PICKER_BASE;
  protected readonly pickerActive = PICKER_ACTIVE;
  protected readonly pickerIdle = PICKER_IDLE;
  protected readonly calendarIcon = CALENDAR_ICON_PATH;
  protected readonly pickerConnector = PICKER_CONNECTOR;

  readonly pickerOpen = signal(false);
  readonly viewYear = signal(new Date().getFullYear());

  regularMonths = computed(() => this.months().filter((m) => m.id !== 'ALL'));

  readonly parsedMonths = computed<ParsedMonth[]>(() =>
    this.regularMonths()
      .map((m) => parseMonth(m))
      .filter((m): m is ParsedMonth => m !== null),
  );

  // Months arrive newest-first, so these are the most recent ones.
  readonly quickMonths = computed(() => this.parsedMonths().slice(0, QUICK_COUNT));

  readonly showPicker = computed(() => this.parsedMonths().length > QUICK_COUNT);

  readonly olderSelected = computed<ParsedMonth | null>(() => {
    const id = this.selectedId();
    if (!id || this.quickMonths().some((m) => m.id === id)) return null;
    return this.parsedMonths().find((m) => m.id === id) ?? null;
  });

  readonly minYear = computed(() => Math.min(...this.parsedMonths().map((m) => m.year)));
  readonly maxYear = computed(() => Math.max(...this.parsedMonths().map((m) => m.year)));

  readonly gridCells = computed<GridCell[]>(() => {
    const year = this.viewYear();
    const selected = this.selectedId();
    const inYear = this.parsedMonths().filter((m) => m.year === year);

    return MONTHS.map((name, index) => {
      const match = inYear.find((m) => m.monthIndex === index);
      return {
        name,
        short: name.slice(0, 3),
        id: match?.id ?? null,
        selected: !!match && match.id === selected,
      };
    });
  });

  onSelect(id: string): void {
    this.closePicker();
    this.monthSelected.emit(id);
  }

  pick(id: string): void {
    this.onSelect(id);
  }

  togglePicker(): void {
    if (this.pickerOpen()) {
      this.closePicker();
      return;
    }

    const selected = this.parsedMonths().find((m) => m.id === this.selectedId());
    this.viewYear.set(selected?.year ?? this.maxYear());
    this.pickerOpen.set(true);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  prevYear(): void {
    this.viewYear.update((y) => Math.max(this.minYear(), y - 1));
  }

  nextYear(): void {
    this.viewYear.update((y) => Math.min(this.maxYear(), y + 1));
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.pickerOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closePicker();
    }
  }
}

function parseMonth(expense: Expense): ParsedMonth | null {
  const [monthName, yearText] = expense.MonthName.split(' ');
  const monthIndex = MONTHS.indexOf(monthName);
  const year = parseInt(yearText, 10);
  if (monthIndex === -1 || Number.isNaN(year)) return null;

  return {
    id: expense.id,
    label: expense.MonthName,
    shortLabel: `${monthName.slice(0, 3)} ${year}`,
    year,
    monthIndex,
  };
}
