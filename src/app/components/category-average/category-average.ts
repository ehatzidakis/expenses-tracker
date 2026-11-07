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
import {
  BUTTON_SECONDARY,
  SEGMENT_BASE,
  SEGMENT_FRAME,
  SEGMENT_OFF,
  SEGMENT_ON,
} from '../../utils/pill-styles';

interface CategoryAverage {
  key: string;
  category: string;
  subCategoryId?: number;
  label: string;
  average: number;
  count: number;
  emoji: string;
}

@Component({
  selector: 'app-category-average',
  standalone: true,
  imports: [CommonModule, PagedEntriesListComponent, SensitiveDirective],
  template: `
    <section aria-labelledby="costs-purchase" class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <h3 id="costs-purchase" class="text-[15px] font-medium text-ink">Per purchase</h3>
        <div role="group" aria-label="Kind" [class]="frame + ' grid-cols-3'">
          @for (mode of modes; track mode.id) {
            <button
              type="button"
              [class]="segment(viewMode() === mode.id) + ' px-3'"
              [attr.aria-pressed]="viewMode() === mode.id"
              (click)="viewMode.set(mode.id)"
            >
              {{ mode.label }}
            </button>
          }
        </div>
      </div>

      @if (!statsQuery.data() && statsQuery.isError()) {
        <div role="alert" class="costs-error flex items-center justify-between gap-3 border-t border-ink/10 py-3">
          <p class="text-[13px] text-cherry">Couldn't load these averages.</p>
          <button type="button" [class]="secondary + ' shrink-0'" (click)="statsQuery.refetch()">Try again</button>
        </div>
      } @else if (statsQuery.isPending()) {
        <ul class="costs-loading animate-pulse divide-y divide-ink/10 border-t border-ink/10" aria-label="Loading these averages">
          @for (row of averages(); track $index) {
            <li class="flex min-h-14 items-center justify-between gap-3 py-2.5">
              <span class="flex items-center gap-3">
                <span class="size-5 rounded bg-raised"></span>
                <span class="flex flex-col gap-1.5">
                  <span class="block h-3.5 w-28 rounded bg-raised"></span>
                  <span class="block h-3 w-14 rounded bg-raised/70"></span>
                </span>
              </span>
              <span class="block h-3.5 w-16 rounded bg-raised"></span>
            </li>
          }
        </ul>
      } @else {
      <ul class="divide-y divide-ink/10 border-t border-ink/10">
        @for (item of averages(); track item.key) {
          <li>
            <button
              type="button"
              class="flex min-h-14 w-full items-center justify-between gap-3 py-2.5 text-left"
              [class.cursor-pointer]="item.category !== 'Supermarket'"
              [attr.aria-expanded]="item.category !== 'Supermarket' ? expandedCategory() === item.key : null"
              (click)="toggleCategory(item.key)"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="w-5 shrink-0 text-center text-[13px] opacity-60 grayscale-[40%]" aria-hidden="true">{{
                  item.emoji
                }}</span>
                <span class="min-w-0">
                  <span class="block truncate text-[15px] font-medium text-ink">{{ item.label }}</span>
                  <span class="block text-[12px] text-ink-3">
                    {{ item.count }} {{ item.count === 1 ? 'purchase' : 'purchases' }}
                  </span>
                </span>
              </span>
              <span class="ml-auto shrink-0 text-right">
                @if (item.count > 0) {
                  <span class="block text-[13px] text-ink tabular-nums" appSensitive="xs">
                    €{{ item.average | number: '1.2-2' }}
                  </span>
                  <span class="block text-[12px] text-ink-3">each, on average</span>
                } @else {
                  <span class="block text-[12px] text-ink-3">None yet</span>
                }
              </span>
              @if (item.category !== 'Supermarket') {
                <svg
                  class="size-3.5 shrink-0 text-ink-3 transition-transform duration-200"
                  [class.rotate-180]="expandedCategory() === item.key"
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
              }
            </button>
            @if (expandedCategory() === item.key && item.category !== 'Supermarket') {
              <div class="pb-3">
                <app-paged-entries-list
                  [title]="item.label"
                  mode="category"
                  [filterValue]="item.category"
                  [subCategoryId]="item.subCategoryId ?? null"
                />
              </div>
            }
          </li>
        }
      </ul>
      }
    </section>
  `,
})
export class CategoryAverageComponent {
  protected readonly frame = SEGMENT_FRAME;
  protected readonly secondary = BUTTON_SECONDARY;

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  protected readonly modes = [
    { id: 'food', label: 'Food' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'games', label: 'Games' },
  ] as const;

  private readonly transactionService = inject(TransactionService);

  // Totals per row are calculated by Firestore and cached; saves refresh them.
  protected readonly statsQuery = injectQuery(() => ({
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
    label: 'Supermarket visit',
  },
  {
    category: 'EatingOut',
    label: 'Restaurant',
  },
  {
    category: 'Takeaway',
    label: 'Takeaway order',
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
