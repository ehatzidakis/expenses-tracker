import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';
import { CATEGORY_META, getSubcategoryOptions } from '../../services/expense-state.service';
import { PagedEntriesListComponent } from '../paged-entries-list/paged-entries-list';

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
  imports: [CommonModule, PagedEntriesListComponent],
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
                  <span class="block text-sm font-bold text-gray-100">
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
export class CategoryAverageComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);

  private readonly categoryTxs = signal<Transaction[]>([]);
  readonly expandedCategory = signal<string | null>(null);
  readonly viewMode = signal<'food' | 'tickets' | 'games'>('food');
  readonly targetCategories = ['Supermarket', 'EatingOut', 'Takeaway', 'Tickets', 'Gaming'];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const txs = await this.transactionService.fetchTransactionsByCategories(
        this.targetCategories,
      );
      this.categoryTxs.set(txs);
    } catch (error) {
      console.error('Failed to load category averages:', error);
    }
  }

  toggleCategory(key: string): void {
    this.expandedCategory.update((current) => (current === key ? null : key));
  }

  private stripEmojiPrefix(value: string): string {
    return value.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim();
  }

  readonly averages = computed<CategoryAverage[]>(() => {
    const transactions = this.categoryTxs();

    const configs = [
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
      // {
      //   category: 'Gaming',
      //   label: 'Game',
      //   iconColor: 'text-cyan-400',
      //   bgColor: 'bg-cyan-500/15 border-cyan-500/30',
      // },
    ];

    const categorySummaries: CategoryAverage[] = configs.map((cfg) => {
      const matches = transactions.filter((t) => t.category === cfg.category);
      const count = matches.length;
      const sum = matches.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const average = count > 0 ? sum / count : 0;

      return {
        key: cfg.category,
        category: cfg.category,
        label: cfg.label,
        average,
        count,
        iconColorClass: cfg.iconColor,
        bgColorClass: cfg.bgColor,
        emoji: CATEGORY_META[cfg.category]?.emoji ?? '📌',
      };
    });

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
      const matches = transactions.filter(
        (t) => t.category === 'Tickets' && Number(t.subCategoryId ?? -1) === option.id,
      );
      const count = matches.length;
      const sum = matches.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const average = count > 0 ? sum / count : 0;

      return {
        key: `Tickets:${option.id}`,
        category: 'Tickets',
        subCategoryId: option.id,
        label: this.stripEmojiPrefix(option.label),
        average,
        count,
        iconColorClass: 'text-purple-400',
        bgColorClass: 'bg-purple-500/15 border-purple-500/30',
        emoji: subcategoryEmojiMap[option.name] ?? '🎟️',
      } satisfies CategoryAverage;
    });

    const gamingSubcategories = getSubcategoryOptions('Gaming').map((option) => {
      const matches = transactions.filter(
        (t) => t.category === 'Gaming' && Number(t.subCategoryId ?? -1) === option.id,
      );
      const count = matches.length;
      const sum = matches.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const average = count > 0 ? sum / count : 0;

      return {
        key: `Gaming:${option.id}`,
        category: 'Gaming',
        subCategoryId: option.id,
        label: this.stripEmojiPrefix(option.label),
        average,
        count,
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
