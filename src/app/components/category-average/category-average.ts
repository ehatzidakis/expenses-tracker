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
  templateUrl: './category-average.html',
})
export class CategoryAverageComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);

  private readonly categoryTxs = signal<Transaction[]>([]);
  readonly expandedCategory = signal<string | null>(null);
  readonly viewMode = signal<'various' | 'tickets' | 'games'>('various');
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
