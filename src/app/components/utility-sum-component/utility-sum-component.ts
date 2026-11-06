import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TransactionService, categoryStatKey } from '../../services/transaction-service';
import { PagedEntriesListComponent } from '../paged-entries-list/paged-entries-list';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { SEGMENT_BASE, SEGMENT_FRAME, SEGMENT_OFF, SEGMENT_ON } from '../../utils/pill-styles';

interface UtilityAverage {
  id: string;
  label: string;
  average: number;
  count: number;
  svgPath: string;
  freq: string;
  billMonths: number;
}

@Component({
  selector: 'app-utility-sum',
  standalone: true,
  imports: [CommonModule, PagedEntriesListComponent, SensitiveDirective],
  template: `
    <section aria-labelledby="costs-bills" class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <h3 id="costs-bills" class="text-[15px] font-medium text-ink">Bills</h3>
        <div role="group" aria-label="Average" [class]="frame + ' grid-cols-2'">
          <button
            type="button"
            [class]="segment(viewMode() === 'bill') + ' px-3.5'"
            [attr.aria-pressed]="viewMode() === 'bill'"
            (click)="viewMode.set('bill')"
          >
            Per bill
          </button>
          <button
            type="button"
            [class]="segment(viewMode() === 'monthly') + ' px-3.5'"
            [attr.aria-pressed]="viewMode() === 'monthly'"
            (click)="viewMode.set('monthly')"
          >
            Per month
          </button>
        </div>
      </div>

      <ul class="divide-y divide-ink/10 border-t border-ink/10">
        @for (item of utilityAverages(); track item.id) {
          <li>
            <button
              type="button"
              class="flex min-h-14 w-full items-center justify-between gap-3 py-2.5 text-left cursor-pointer"
              [attr.aria-expanded]="expandedUtility() === item.label"
              (click)="toggleUtility(item.label)"
            >
              <span class="flex min-w-0 items-center gap-3">
                <svg
                  class="size-5 shrink-0 text-ink-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svgPath" />
                </svg>
                <span class="min-w-0">
                  <span class="block truncate text-[15px] font-medium text-ink">{{ item.label }}</span>
                  <span class="block text-[12px] text-ink-3">
                    {{ item.count }} {{ item.count === 1 ? 'bill' : 'bills' }}
                  </span>
                </span>
              </span>
              <span class="ml-auto shrink-0 text-right">
                <!-- Other (17) and Taxes (18) never show an average -->
                @if (item.count > 0 && item.id !== '18' && item.id !== '17') {
                  <span class="block text-[13px] text-ink tabular-nums" appSensitive="xs">
                    €{{ item.average | number: '1.2-2' }}
                  </span>
                  <span class="block text-[12px] text-ink-3">{{ freqLabel(item.freq) }}</span>
                } @else if (item.id === '18' || item.id === '17') {
                  <span class="block text-[12px] text-ink-3">Varies</span>
                } @else {
                  <span class="block text-[12px] text-ink-3">No bills yet</span>
                }
              </span>
                            <svg
                class="size-3.5 shrink-0 text-ink-3 transition-transform duration-200"
                [class.rotate-180]="expandedUtility() === item.label"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                />
              </svg>
            </button>
            @if (expandedUtility() === item.label) {
              <div class="pb-3">
                <app-paged-entries-list
                  [title]="item.label"
                  mode="category"
                  [filterValue]="'Utilities'"
                  [subCategoryId]="+item.id"
                />
              </div>
            }
          </li>
        }
      </ul>
    </section>
  `,
})
export class UtilitySumComponent {
  protected readonly frame = SEGMENT_FRAME;

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  /** "/bi-monthly" → "every 2 months". */
  freqLabel(freq: string): string {
    const labels: Record<string, string> = {
      '/monthly': 'a month',
      '/bi-monthly': 'every 2 months',
      '/tri-monthly': 'every 3 months',
    };
    return labels[freq] ?? freq.replace('/', '');
  }

  private readonly transactionService = inject(TransactionService);

  // Totals per utility are calculated by Firestore and cached; saves refresh them.
  private readonly statsQuery = injectQuery(() => ({
    queryKey: ['expenses', 'stats', 'utilities'],
    queryFn: () =>
      this.transactionService.fetchCategoryStats(
        UTILITY_TARGETS.map((target) => ({ category: 'Utilities', subCategoryId: target.id })),
      ),
  }));
  readonly expandedUtility = signal<string | null>(null);
  readonly viewMode = signal<'bill' | 'monthly'>('monthly');

  toggleUtility(label: string): void {
    this.expandedUtility.update((current) => (current === label ? null : label));
  }

  readonly utilityAverages = computed<UtilityAverage[]>(() => {
    const stats = this.statsQuery.data() ?? {};
    const mode = this.viewMode();

    return UTILITY_TARGETS.map((target) => {
      const stat = stats[categoryStatKey({ category: 'Utilities', subCategoryId: target.id })];
      const count = stat?.count ?? 0;
      const sum = stat?.sum ?? 0;
      const billAverage = count > 0 ? sum / count : 0;
      const monthlyAverage = target.billMonths > 1 ? billAverage / target.billMonths : billAverage;
      const average = mode === 'monthly' ? monthlyAverage : billAverage;

      return {
        id: String(target.id),
        label: target.label,
        average,
        count,
        svgPath: target.svg,
        freq: mode === 'monthly' ? '/monthly' : target.freq,
        billMonths: target.billMonths,
      };
    });
  });
}

const UTILITY_TARGETS = [
  {
    id: 12,
    label: 'Energy',
    svg: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 14,
    label: 'Internet',
    svg: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z',
    freq: '/bi-monthly',
    billMonths: 2,
  },
  {
    id: 15,
    label: 'Mobile',
    svg: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 16,
    label: 'Water',
    svg: 'M12 2.25c0 0-6.75 8.25-6.75 13.5a6.75 6.75 0 0013.5 0C18.75 10.5 12 2.25 12 2.25z',
    freq: '/tri-monthly',
    billMonths: 3,
  },
  {
    id: 13,
    label: 'Κοινόχρηστα',
    svg: 'M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.527.526.823 1.25.823 2.004z',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 17,
    label: 'Other',
    svg: 'M12 2.25A9.75 9.75 0 1021.75 12 9.75 9.75 0 0012 2.25zm.75 5.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.5 3h1.5v6h-1.5z',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 18,
    label: 'Taxes',
    svg: 'M7.5 4.5h9a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0116.5 19.5h-9A2.25 2.25 0 015 17.25V6.75A2.25 2.25 0 017.5 4.5zm9 3.75h-9M9 12h6M9 15h6',
    freq: '/monthly',
    billMonths: 1,
  },
];
