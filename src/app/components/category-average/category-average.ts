import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import {
  TransactionService,
  categoryStatKey,
  type CategoryStatGroup,
} from '../../services/transaction-service';
import { CATEGORY_META, getSubcategoryOptions } from '../../services/expense-state.service';
import { PagedEntriesListComponent } from '../paged-entries-list/paged-entries-list';
import { SensitiveDirective } from '../../utils/sensitive.directive';

interface CategoryAverage {
  key: string;
  category: string;
  subCategoryId?: number;
  label: string;
  average: number;
  count: number;
  iconColorClass: string;
  bgColorClass: string;
  emoji: string;
}

@Component({
  selector: 'app-category-average',
  standalone: true,
  imports: [CommonModule, PagedEntriesListComponent, SensitiveDirective],
  template: `
    <div
      class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-sm select-none"
    >
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-xs font-semibold text-gray-100">Transaction Averages</h3>
          <p class="text-xs text-gray-400 mt-0.5">Average cost per entry</p>
        </div>

        <div class="inline-flex rounded-full border border-gray-700 bg-gray-950/80 p-1">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-indigo-500]="viewMode() === 'food'"
            [class.text-white]="viewMode() === 'food'"
            [class.text-gray-400]="viewMode() !== 'food'"
            (click)="viewMode.set('food')"
          >
            Food
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-indigo-500]="viewMode() === 'tickets'"
            [class.text-white]="viewMode() === 'tickets'"
            [class.text-gray-400]="viewMode() !== 'tickets'"
            (click)="viewMode.set('tickets')"
          >
            Tickets
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [class.bg-indigo-500]="viewMode() === 'games'"
            [class.text-white]="viewMode() === 'games'"
            [class.text-gray-400]="viewMode() !== 'games'"
            (click)="viewMode.set('games')"
          >
            Games
          </button>
        </div>
      </div>

      <div class="space-y-3">
        @for (item of averages(); track item.key) {
          <div class="space-y-2">
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-gray-800/60 transition-colors hover:bg-gray-800/60 cursor-pointer"
              (click)="toggleCategory(item.key)"
            >
              <div class="flex items-center gap-3.5">
                <div
                  class="flex items-center justify-center w-10 h-10 rounded-full border text-lg"
                  [ngClass]="item.bgColorClass"
                >
                  <span>{{ item.emoji }}</span>
                </div>

                <div>
                  <span class="block text-sm font-medium text-gray-200">{{ item.label }}</span>
                  <span class="block text-[10px] text-gray-500 mt-0.5">
                    Based on {{ item.count }} {{ item.count === 1 ? 'entry' : 'entries' }}
                  </span>
                </div>
              </div>

              <div class="text-right">
                @if (item.count > 0) {
                  <span class="block text-sm font-bold text-gray-100" appSensitive>
                    €{{ item.average | number: '1.2-2' }}
                  </span>
                  <span class="block text-[10px] text-gray-400 font-medium">/avg</span>
                } @else {
                  <span class="block text-xs font-medium text-gray-500 italic">No data</span>
                }
              </div>
            </div>

            @if (expandedCategory() === item.key && item.category !== 'Supermarket') {
              <app-paged-entries-list
                [title]="item.label"
                mode="category"
                [filterValue]="item.category"
                [subCategoryId]="item.subCategoryId ?? null"
              />
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class CategoryAverageComponent {
  private readonly transactionService = inject(TransactionService);

  // Totals per row are calculated by Firestore and cached; saves refresh them.
  private readonly statsQuery = injectQuery(() => ({
    queryKey: ['expenses', 'stats', 'category-averages'],
    queryFn: () => this.transactionService.fetchCategoryStats(statGroups()),
  }));
  readonly expandedCategory = signal<string | null>(null);
  readonly viewMode = signal<'food' | 'tickets' | 'games'>('food');

  toggleCategory(key: string): void {
    this.expandedCategory.update((current) => (current === key ? null : key));
  }

  private stripEmojiPrefix(value: string): string {
    return value.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim();
  }

  private statFor(category: string, subCategoryId?: number): { count: number; average: number } {
    const stat = this.statsQuery.data()?.[categoryStatKey({ category, subCategoryId })];
    const count = stat?.count ?? 0;
    return { count, average: count > 0 ? (stat?.sum ?? 0) / count : 0 };
  }

  readonly averages = computed<CategoryAverage[]>(() => {
    const categorySummaries: CategoryAverage[] = FOOD_CONFIGS.map((cfg) => ({
      key: cfg.category,
      category: cfg.category,
      label: cfg.label,
      ...this.statFor(cfg.category),
      iconColorClass: cfg.iconColor,
      bgColorClass: cfg.bgColor,
      emoji: CATEGORY_META[cfg.category]?.emoji ?? '📌',
    }));

    const subcategoryEmojiMap: Record<string, string> = {
      theatre: '🎭',
      movies: '🎬',
      concert: '🎤',
      standUp: '🤣',
      escape: '🎃',
      misc: '❓',
      newRelease: '🎮',
      olderTitle: '🕹️',
      subscription: '🔄',
      peripheral: '👾',
      dlc: '🧩',
    };

    const ticketSubcategories = getSubcategoryOptions('Tickets').map((option) => {
      return {
        key: `Tickets:${option.id}`,
        category: 'Tickets',
        subCategoryId: option.id,
        label: this.stripEmojiPrefix(option.label),
        ...this.statFor('Tickets', option.id),
        iconColorClass: 'text-purple-400',
        bgColorClass: 'bg-purple-500/15 border-purple-500/30',
        emoji: subcategoryEmojiMap[option.name] ?? '🎟️',
      } satisfies CategoryAverage;
    });

    const gamingSubcategories = getSubcategoryOptions('Gaming').map((option) => {
      return {
        key: `Gaming:${option.id}`,
        category: 'Gaming',
        subCategoryId: option.id,
        label: this.stripEmojiPrefix(option.label),
        ...this.statFor('Gaming', option.id),
        iconColorClass: 'text-cyan-400',
        bgColorClass: 'bg-cyan-500/15 border-cyan-500/30',
        emoji: subcategoryEmojiMap[option.name] ?? '🎮',
      } satisfies CategoryAverage;
    });

    if (this.viewMode() === 'tickets') {
      return ticketSubcategories;
    }

    if (this.viewMode() === 'games') {
      return gamingSubcategories;
    }

    return categorySummaries;
  });
}

const FOOD_CONFIGS = [
  {
    category: 'Supermarket',
    label: 'Supermarket Visit',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15 border-emerald-500/30',
  },
  {
    category: 'EatingOut',
    label: 'Restaurant',
    iconColor: 'text-rose-400',
    bgColor: 'bg-rose-500/15 border-rose-500/30',
  },
  {
    category: 'Takeaway',
    label: 'Takeaway Order',
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/15 border-amber-500/30',
  },
];

/** Every row the card can show: food categories plus each Tickets and Gaming subcategory. */
function statGroups(): CategoryStatGroup[] {
  return [
    ...FOOD_CONFIGS.map((cfg) => ({ category: cfg.category })),
    ...getSubcategoryOptions('Tickets').map((option) => ({
      category: 'Tickets',
      subCategoryId: option.id,
    })),
    ...getSubcategoryOptions('Gaming').map((option) => ({
      category: 'Gaming',
      subCategoryId: option.id,
    })),
  ];
}
