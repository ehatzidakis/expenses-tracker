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
import { Expense } from '../../models/expenses.model';
import {
  ACTIVE_PILL,
  CALENDAR_ICON_PATH,
  CHEVRON_LEFT_PATH,
  CHEVRON_RIGHT_PATH,
  IDLE_PILL,
  PAGER_ARROW,
  PAGER_CALENDAR,
  PAGER_CALENDAR_OPEN,
  PAGER_DIVIDER,
  PAGER_PILLS,
  PAGER_ROW,
  PICKER_PANEL,
  QUICK_PILL,
  QUICK_PILL_GROW,
} from '../../utils/pill-styles';
import { PAGER_SIZE, followWindow, windowStartAt } from '../../utils/pager-window';

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
  /** Full name, shown on the selected pill: "November 2026". */
  label: string;
  /** Three letters, shown on idle pills so the selected one has room: "Nov". */
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

@Component({
  selector: 'app-month-selector',
  standalone: true,
  host: {
    class: 'block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closePicker()',
  },
  template: `
    <section [class]="pagerRow">
      <button
        type="button"
        data-testid="month-newer"
        aria-label="Newer month"
        [class]="pagerArrow"
        [disabled]="selectedIndex() <= 0"
        (click)="step(-1)"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="chevronLeft" />
        </svg>
      </button>

      <div role="group" aria-label="Months" [class]="pagerPills">
        @for (item of visibleMonths(); track item.id) {
          <button
            type="button"
            data-testid="month-pill"
            (click)="onSelect(item.id)"
            [class]="
              selectedId() === item.id
                ? quickPillGrow + ' ' + activePill
                : quickPill + ' ' + idlePill
            "
            [attr.aria-pressed]="selectedId() === item.id"
            [attr.aria-label]="item.label"
          >
            {{ selectedId() === item.id ? item.label : item.shortLabel }}
          </button>
        }
      </div>

      <button
        type="button"
        data-testid="month-older"
        aria-label="Older month"
        [class]="pagerArrow"
        [disabled]="selectedIndex() >= parsedMonths().length - 1"
        (click)="step(1)"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" [attr.d]="chevronRight" />
        </svg>
      </button>

      @if (showPicker()) {
        <span [class]="pagerDivider" aria-hidden="true"></span>
        <div class="flex shrink-0">
          <button
            type="button"
            data-testid="month-picker-toggle"
            aria-label="Pick a month"
            (click)="togglePicker()"
            [class]="pickerOpen() ? pagerCalendarOpen : pagerCalendar"
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
              aria-label="Pick a month"
              data-testid="month-picker"
              [class]="pickerPanel"
            >
              <div class="flex items-center justify-between mb-3">
                <button
                  type="button"
                  data-testid="prev-year"
                  (click)="prevYear()"
                  [disabled]="viewYear() <= minYear()"
                  aria-label="Previous year"
                  class="flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-raised-hi disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    />
                  </svg>
                </button>
                <span data-testid="view-year" class="text-sm font-medium text-ink">
                  {{ viewYear() }}
                </span>
                <button
                  type="button"
                  data-testid="next-year"
                  (click)="nextYear()"
                  [disabled]="viewYear() >= maxYear()"
                  aria-label="Next year"
                  class="flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-raised-hi disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    />
                  </svg>
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
                        ? 'bg-ember text-ground font-medium'
                        : cell.id
                          ? 'bg-raised-hi/70 text-ink-2 hover:bg-raised-hi hover:text-ink'
                          : 'text-ink-4 cursor-not-allowed'
                    "
                    class="min-h-11 rounded-xl text-[13px] transition-colors duration-150 cursor-pointer"
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

  protected readonly quickPill = QUICK_PILL;
  protected readonly quickPillGrow = QUICK_PILL_GROW;
  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;
  protected readonly pagerRow = PAGER_ROW;
  protected readonly pagerPills = PAGER_PILLS;
  protected readonly pagerArrow = PAGER_ARROW;
  protected readonly pagerDivider = PAGER_DIVIDER;
  protected readonly pagerCalendar = PAGER_CALENDAR;
  protected readonly pagerCalendarOpen = PAGER_CALENDAR_OPEN;
  protected readonly chevronLeft = CHEVRON_LEFT_PATH;
  protected readonly chevronRight = CHEVRON_RIGHT_PATH;
  protected readonly calendarIcon = CALENDAR_ICON_PATH;
  protected readonly pickerPanel = PICKER_PANEL;

  readonly pickerOpen = signal(false);
  readonly viewYear = signal(new Date().getFullYear());

  regularMonths = computed(() => this.months().filter((m) => m.id !== 'ALL'));

  readonly parsedMonths = computed<ParsedMonth[]>(() =>
    this.regularMonths()
      .map((m) => parseMonth(m))
      .filter((m): m is ParsedMonth => m !== null),
  );

  /** Months arrive newest-first, so index 0 is the latest month. */
  readonly selectedIndex = computed(() =>
    this.parsedMonths().findIndex((m) => m.id === this.selectedId()),
  );

  /** First of the three visible months. Follows the selection; a calendar pick sets it directly. */
  readonly windowStart = linkedSignal<{ index: number; count: number }, number>({
    source: () => ({ index: this.selectedIndex(), count: this.parsedMonths().length }),
    computation: ({ index, count }, previous) =>
      previous ? followWindow(previous.value, index, count) : windowStartAt(index, count),
  });

  readonly visibleMonths = computed(() =>
    this.parsedMonths().slice(this.windowStart(), this.windowStart() + PAGER_SIZE),
  );

  readonly showPicker = computed(() => this.parsedMonths().length > PAGER_SIZE);

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

  /** Steps the selection one month newer (-1) or older (+1). */
  step(direction: -1 | 1): void {
    const next = this.parsedMonths()[this.selectedIndex() + direction];
    if (next) this.onSelect(next.id);
  }

  /** A calendar pick leads the row, followed by the two months before it. */
  pick(id: string): void {
    const index = this.parsedMonths().findIndex((m) => m.id === id);
    this.windowStart.set(windowStartAt(index, this.parsedMonths().length));
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
    shortLabel: monthName.slice(0, 3),
    year,
    monthIndex,
  };
}
