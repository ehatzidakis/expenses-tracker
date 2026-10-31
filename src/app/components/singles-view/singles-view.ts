import { Component, ElementRef, computed, inject, input, model, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { Adjustment } from '../../models/adjustments.model';
import { AdjustmentCardComponent } from '../adjustment-card.component/adjustment-card.component';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { ACTIVE_PILL, IDLE_PILL, PILL_BASE } from '../../utils/pill-styles';
import { SinglesType, filterSingles, singleYears, singlesTotals } from './singles-view.util';

@Component({
  selector: 'app-singles-view',
  standalone: true,
  imports: [DecimalPipe, AdjustmentCardComponent, SensitiveDirective],
  host: {
    class: 'flex flex-col gap-3',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeYearMenu()',
  },
  template: `
    @if (adjustments().length) {
      <!-- Filters -->
      <section class="flex items-center gap-2">
        <button
          type="button"
          data-testid="filter-addition"
          (click)="toggleType('addition')"
          [class]="pillBase + ' ' + (type() === 'addition' ? activePill : idlePill)"
          [attr.aria-pressed]="type() === 'addition'"
        >
          ↑ Additions
        </button>
        <button
          type="button"
          data-testid="filter-subtraction"
          (click)="toggleType('subtraction')"
          [class]="pillBase + ' ' + (type() === 'subtraction' ? activePill : idlePill)"
          [attr.aria-pressed]="type() === 'subtraction'"
        >
          ↓ Subtractions
        </button>

        <div class="relative ml-auto shrink-0">
          <button
            type="button"
            data-testid="year-toggle"
            (click)="toggleYearMenu()"
            [class]="pillBase + ' flex items-center gap-1 ' + (year() !== null ? activePill : idlePill)"
            aria-haspopup="menu"
            [attr.aria-expanded]="yearMenuOpen()"
          >
            {{ year() ?? 'All years' }}
            <svg
              class="w-3 h-3 transition-transform duration-150"
              [class.rotate-180]="yearMenuOpen()"
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

          @if (yearMenuOpen()) {
            <div
              role="menu"
              data-testid="year-menu"
              class="absolute right-0 top-full mt-2 z-20 w-36 bg-gray-900 border border-gray-800 rounded-2xl p-2 shadow-xl flex flex-col gap-1"
            >
              <button
                type="button"
                role="menuitemradio"
                data-testid="year-option"
                (click)="pickYear(null)"
                [attr.aria-checked]="year() === null"
                [class]="year() === null ? menuActive : menuIdle"
                class="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors duration-150"
              >
                All years
              </button>
              @for (y of years(); track y) {
                <button
                  type="button"
                  role="menuitemradio"
                  data-testid="year-option"
                  (click)="pickYear(y)"
                  [attr.aria-checked]="year() === y"
                  [class]="year() === y ? menuActive : menuIdle"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors duration-150"
                >
                  {{ y }}
                </button>
              }
            </div>
          }
        </div>
      </section>

      @if (filtered().length) {
        <!-- Totals for the current filters -->
        <div
          data-testid="singles-totals"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-gray-500"
        >
          <span>{{ totals().count }} item{{ totals().count !== 1 ? 's' : '' }}</span>
          @switch (type()) {
            @case ('addition') {
              <span>
                Total
                <span class="font-semibold text-emerald-400 tabular-nums" appSensitive
                  >€{{ totals().incoming | number: '1.2-2' }}</span
                >
              </span>
            }
            @case ('subtraction') {
              <span>
                Total
                <span class="font-semibold text-red-400 tabular-nums" appSensitive
                  >€{{ totals().outgoing | number: '1.2-2' }}</span
                >
              </span>
            }
            @default {
              <span>
                In
                <span class="font-semibold text-emerald-400 tabular-nums" appSensitive
                  >€{{ totals().incoming | number: '1.2-2' }}</span
                >
              </span>
              <span>
                Out
                <span class="font-semibold text-red-400 tabular-nums" appSensitive
                  >€{{ totals().outgoing | number: '1.2-2' }}</span
                >
              </span>
              <span>
                Net
                <span
                  class="font-semibold tabular-nums"
                  [class]="totals().net >= 0 ? 'text-emerald-400' : 'text-red-400'"
                  appSensitive
                  >{{ totals().net < 0 ? '−' : '' }}€{{
                    absNet() | number: '1.2-2'
                  }}</span
                >
              </span>
            }
          }
        </div>

        <div class="flex flex-col gap-3">
          @for (adjustment of filtered(); track adjustment.id) {
            <app-adjustment-card
              [adjustment]="adjustment"
              (cardClick)="edit.emit(adjustment)"
            ></app-adjustment-card>
          }
        </div>
      } @else {
        <div
          data-testid="singles-no-match"
          class="flex flex-col items-center justify-center gap-3 text-center py-12 px-4 bg-gray-900/60 border border-gray-800/80 rounded-2xl text-gray-500 text-sm"
        >
          No singles match these filters
          <button
            type="button"
            data-testid="clear-filters"
            (click)="clearFilters()"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 hover:border-gray-600 transition-colors"
          >
            Clear filters
          </button>
        </div>
      }
    } @else {
      <div
        class="flex flex-col items-center justify-center gap-2 text-center py-16 px-4 bg-gray-900/60 border border-gray-800/80 rounded-2xl text-gray-500 text-sm"
      >
        No singles yet
      </div>
    }
  `,
})
export class SinglesViewComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Non-trip adjustments, newest first. */
  adjustments = input.required<Adjustment[]>();
  type = model<SinglesType | null>(null);
  year = model<number | null>(null);

  edit = output<Adjustment>();

  protected readonly pillBase = PILL_BASE;
  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;
  protected readonly menuActive = 'bg-indigo-600 text-white font-medium';
  protected readonly menuIdle = 'text-gray-300 hover:bg-gray-800';

  readonly yearMenuOpen = signal(false);

  readonly years = computed(() => singleYears(this.adjustments()));
  readonly filtered = computed(() => filterSingles(this.adjustments(), this.type(), this.year()));
  readonly totals = computed(() => singlesTotals(this.filtered()));
  readonly absNet = computed(() => Math.abs(this.totals().net));

  toggleType(type: SinglesType): void {
    this.type.set(this.type() === type ? null : type);
  }

  toggleYearMenu(): void {
    this.yearMenuOpen.update((open) => !open);
  }

  closeYearMenu(): void {
    this.yearMenuOpen.set(false);
  }

  pickYear(year: number | null): void {
    this.year.set(year);
    this.closeYearMenu();
  }

  clearFilters(): void {
    this.type.set(null);
    this.year.set(null);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.yearMenuOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeYearMenu();
    }
  }
}
