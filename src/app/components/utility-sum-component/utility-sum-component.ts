import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TransactionService, categoryStatKey } from '../../services/transaction-service';
import { PagedEntriesListComponent } from '../paged-entries-list/paged-entries-list';
import { SensitiveDirective } from '../../utils/sensitive.directive';

interface UtilityAverage {
  id: string;
  label: string;
  average: number;
  count: number;
  iconColorClass: string;
  bgColorClass: string;
  svgPath: string;
  freq: string;
  billMonths: number;
}

@Component({
  selector: 'app-utility-sum',
  standalone: true,
  imports: [CommonModule, PagedEntriesListComponent, SensitiveDirective],
  template: `
    <div
      class="bg-panel/60 border border-raised/80 rounded-2xl p-5 select-none"
    >
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-ink">Utility Averages</h3>
          <p class="text-xs text-ink-2 mt-0.5">
            {{ viewMode() === 'bill' ? 'Average per bill' : 'Average per month' }}
          </p>
        </div>

        <div class="inline-flex rounded-full border border-edge bg-ground/80 p-1">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-ember]="viewMode() === 'bill'"
            [class.text-ground]="viewMode() === 'bill'"
            [class.text-ink-2]="viewMode() !== 'bill'"
            (click)="viewMode.set('bill')"
          >
            Per Bill
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-ember]="viewMode() === 'monthly'"
            [class.text-ground]="viewMode() === 'monthly'"
            [class.text-ink-2]="viewMode() !== 'monthly'"
            (click)="viewMode.set('monthly')"
          >
            Monthly
          </button>
        </div>
      </div>

      <!-- List Container -->
      <div class="space-y-3">
        @for (item of utilityAverages(); track item.id) {
          <div class="space-y-2">
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-raised/40 border border-raised/60 transition-colors hover:bg-raised/60 cursor-pointer"
              (click)="toggleUtility(item.label)"
            >
              <div class="flex items-center gap-3.5">
                <!-- Icon Wrapper -->
                <div
                  class="flex items-center justify-center w-10 h-10 rounded-full border"
                  [ngClass]="item.bgColorClass"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                    [ngClass]="item.iconColorClass"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.svgPath" />
                  </svg>
                </div>

                <!-- Labels -->
                <div>
                  <span class="block text-sm font-medium text-ink">{{ item.label }}</span>
                  <span class="block text-[11px] text-ink-3 mt-0.5">
                    Based on {{ item.count }} {{ item.count === 1 ? 'record' : 'records' }}
                  </span>
                </div>
              </div>

              <!-- Average Amount -->
              <div class="text-right">
                <!-- Other (17) and Taxes (18) never show an average -->
                @if (item.count > 0 && item.id !== '18' && item.id !== '17') {
                  <span class="block text-sm font-bold text-ink" appSensitive>
                    €{{ item.average | number: '1.2-2' }}
                  </span>
                  <span class="block text-[11px] text-ink-2 font-medium">{{ item.freq }}</span>
                } @else if (item.id === '18' || item.id === '17') {
                  <span class="block text-xs font-medium text-ink-3 italic">-</span>
                } @else {
                  <span class="block text-xs font-medium text-ink-3 italic">No data</span>
                }
              </div>
            </div>

            @if (expandedUtility() === item.label) {
              <app-paged-entries-list
                [title]="item.label"
                mode="category"
                [filterValue]="'Utilities'"
                [subCategoryId]="+item.id"
              />
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class UtilitySumComponent {
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
        iconColorClass: target.iconColor,
        bgColorClass: target.bgColor,
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
    iconColor: 'text-ember-soft',
    bgColor: 'bg-ember/15 border-ember/30',
    svg: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 14,
    label: 'Internet',
    iconColor: 'text-ember-ink',
    bgColor: 'bg-ember/15 border-ember/30',
    svg: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z',
    freq: '/bi-monthly',
    billMonths: 2,
  },
  {
    id: 15,
    label: 'Mobile',
    iconColor: 'text-avocado-ink',
    bgColor: 'bg-avocado/15 border-avocado/30',
    svg: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 16,
    label: 'Water',
    iconColor: 'text-ember-ink',
    bgColor: 'bg-ember/15 border-ember/30',
    svg: 'M12 2.25c0 0-6.75 8.25-6.75 13.5a6.75 6.75 0 0013.5 0C18.75 10.5 12 2.25 12 2.25z',
    freq: '/tri-monthly',
    billMonths: 3,
  },
  {
    id: 13,
    label: 'Κοινόχρηστα',
    iconColor: 'text-ember-ink',
    bgColor: 'bg-ember/15 border-ember/30',
    svg: 'M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.527.526.823 1.25.823 2.004z',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 17,
    label: 'Other',
    iconColor: 'text-ink-2',
    bgColor: 'bg-ink-3/15 border-ink-3/30',
    svg: 'M12 2.25A9.75 9.75 0 1021.75 12 9.75 9.75 0 0012 2.25zm.75 5.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.5 3h1.5v6h-1.5z',
    freq: '/monthly',
    billMonths: 1,
  },
  {
    id: 18,
    label: 'Taxes',
    iconColor: 'text-cherry',
    bgColor: 'bg-cherry-fill/15 border-cherry-fill/30',
    svg: 'M7.5 4.5h9a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0116.5 19.5h-9A2.25 2.25 0 015 17.25V6.75A2.25 2.25 0 017.5 4.5zm9 3.75h-9M9 12h6M9 15h6',
    freq: '/monthly',
    billMonths: 1,
  },
];
