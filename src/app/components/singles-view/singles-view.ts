import { Component, ElementRef, computed, inject, input, model, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { Adjustment } from '../../models/adjustments.model';
import { AdjustmentCardComponent } from '../adjustment-card.component/adjustment-card.component';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { PICKER_PANEL } from '../../utils/pill-styles';
import { SinglesType, filterSingles, singleYears, singlesTotals } from './singles-view.util';

@Component({
  selector: 'app-singles-view',
  standalone: true,
  imports: [DecimalPipe, AdjustmentCardComponent, SensitiveDirective],
  host: {
    class: 'flex flex-col gap-5',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeYearMenu()',
  },
  template: `
    @if (adjustments().length) {
      <!-- Totals for the current filters -->
      @if (filtered().length) {
      <section
        data-testid="singles-totals"
        aria-label="One-offs summary"
        class="rounded-2xl border border-ink/10 bg-panel px-5 py-4 shadow-[inset_0_1px_0_rgb(241_230_210/0.06)]"
      >
        <p class="text-[13px] text-ink-2">
          {{ totals().count }} one-off{{ totals().count !== 1 ? 's' : '' }} · {{ year() ?? 'all years' }}
        </p>
        @switch (type()) {
          @case ('addition') {
            <p class="mt-2 type-wide text-[32px] font-bold leading-none text-avocado" appSensitive>
              +€{{ totals().incoming | number: '1.2-2' }}
            </p>
            <p class="mt-1.5 text-[12px] text-ink-3">Income</p>
          }
          @case ('subtraction') {
            <p class="mt-2 type-wide text-[32px] font-bold leading-none text-ink" appSensitive>
              €{{ totals().outgoing | number: '1.2-2' }}
            </p>
            <p class="mt-1.5 text-[12px] text-ink-3">Spent</p>
          }
          @default {
            <dl class="mt-3 grid grid-cols-3 gap-3">
              <div>
                <dt class="text-[12px] text-ink-3">In</dt>
                <dd class="mt-1 type-wide text-[15px] font-semibold text-avocado" appSensitive="sm">
                  €{{ totals().incoming | number: '1.2-2' }}
                </dd>
              </div>
              <div>
                <dt class="text-[12px] text-ink-3">Out</dt>
                <dd class="mt-1 type-wide text-[15px] font-semibold text-ink" appSensitive="sm">
                  €{{ totals().outgoing | number: '1.2-2' }}
                </dd>
              </div>
              <div>
                <dt class="text-[12px] text-ink-3">Net</dt>
                <dd
                  class="mt-1 type-wide text-[15px] font-semibold"
                  [class]="totals().net >= 0 ? 'text-avocado' : 'text-cherry'"
                  appSensitive="sm"
                >
                  {{ totals().net < 0 ? '−' : '' }}€{{ absNet() | number: '1.2-2' }}
                </dd>
              </div>
            </dl>
          }
        }
      </section>
      }

      <!-- Filters -->
      <div class="flex items-center gap-2">
        <div role="group" aria-label="Show" class="inline-flex rounded-xl border border-edge p-0.5">
          @for (option of typeOptions; track option.label) {
            <button
              type="button"
              [attr.data-testid]="option.testId"
              class="min-h-10 rounded-[10px] px-3.5 text-[13px] font-medium transition-colors cursor-pointer"
              [class]="type() === option.value ? 'bg-ember/20 text-ink ring-1 ring-inset ring-ember/60' : 'text-ink-3 hover:text-ink'"
              [attr.aria-pressed]="type() === option.value"
              (click)="type.set(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>

        <div class="relative ml-auto shrink-0">
          <button
            type="button"
            data-testid="year-toggle"
            (click)="toggleYearMenu()"
            class="flex min-h-11 items-center gap-1 rounded-xl border px-3.5 text-[13px] font-medium transition-colors cursor-pointer"
            [class]="year() !== null ? 'border-ember text-ember-ink' : 'border-edge text-ink-2 hover:text-ink'"
            aria-haspopup="menu"
            [attr.aria-expanded]="yearMenuOpen()"
          >
            {{ year() ?? 'All years' }}
            <svg
              class="size-3.5 transition-transform duration-150"
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
            <div role="menu" data-testid="year-menu" [class]="menuPanel + ' !w-40 flex flex-col gap-1 !p-2'">
              <button
                type="button"
                role="menuitemradio"
                data-testid="year-option"
                (click)="pickYear(null)"
                [attr.aria-checked]="year() === null"
                [class]="year() === null ? menuActive : menuIdle"
                class="w-full min-h-11 text-left px-3 rounded-xl text-[13px] transition-colors duration-150 cursor-pointer"
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
                  class="w-full min-h-11 text-left px-3 rounded-xl text-[13px] transition-colors duration-150 cursor-pointer"
                >
                  {{ y }}
                </button>
              }
            </div>
          }
        </div>
      </div>

      @if (filtered().length) {
        <ul class="-mt-2 divide-y divide-ink/10 border-t border-ink/10">
          @for (adjustment of filtered(); track adjustment.id) {
            <li>
              <app-adjustment-card
                [adjustment]="adjustment"
                (cardClick)="edit.emit(adjustment)"
              ></app-adjustment-card>
            </li>
          }
        </ul>
      } @else {
        <div
          data-testid="singles-no-match"
          class="flex flex-col items-center justify-center gap-3 border-t border-ink/10 py-12 text-center text-[14px] text-ink-3"
        >
          No one-offs match these filters
          <button
            type="button"
            data-testid="clear-filters"
            (click)="clearFilters()"
            class="min-h-11 rounded-xl border border-edge px-4 text-[13px] font-medium text-ink-2 hover:text-ink cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      }
    } @else {
      <div class="flex flex-col items-center gap-2 border-y border-ink/10 py-14 text-center">
        <p class="text-[15px] text-ink">No one-offs yet</p>
        <p class="max-w-64 text-[13px] text-ink-3">
          One-off income and expenses, like a bonus or a new laptop, show up here once you add them
          from the Add tab.
        </p>
      </div>
    }
  `,
})
export class SinglesViewComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Non-trip one-offs, newest first. */
  adjustments = input.required<Adjustment[]>();
  type = model<SinglesType | null>(null);
  year = model<number | null>(null);

  edit = output<Adjustment>();

  protected readonly typeOptions: { label: string; value: SinglesType | null; testId: string }[] = [
    { label: 'All', value: null, testId: 'filter-all' },
    { label: 'Income', value: 'addition', testId: 'filter-addition' },
    { label: 'Expense', value: 'subtraction', testId: 'filter-subtraction' },
  ];
  protected readonly menuPanel = PICKER_PANEL;
  protected readonly menuActive = 'bg-ember text-ground font-medium';
  protected readonly menuIdle = 'text-ink-2 hover:bg-raised-hi';

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
