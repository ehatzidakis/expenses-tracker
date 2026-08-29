import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';
import { getSubcategoryOptions } from '../../services/expense-state.service';
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
  svgPath: string;
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

  readonly averages = computed<CategoryAverage[]>(() => {
    const transactions = this.categoryTxs();

    const configs = [
      {
        category: 'Supermarket',
        label: 'Supermarket Visit',
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/15 border-emerald-500/30',
        svg: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
      },
      {
        category: 'EatingOut',
        label: 'Restaurant',
        iconColor: 'text-rose-400',
        bgColor: 'bg-rose-500/15 border-rose-500/30',
        svg: 'M18 2v20M18 2c-2.76 0-5 2.24-5 5v6h5M6 2v7a3 3 0 006 0V2M9 2v20',
      },
      {
        category: 'Takeaway',
        label: 'Takeaway Order',
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-500/15 border-amber-500/30',
        svg: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z',
      },
      // {
      //   category: 'Tickets',
      //   label: 'Ticket',
      //   iconColor: 'text-purple-400',
      //   bgColor: 'bg-purple-500/15 border-purple-500/30',
      //   svg: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18M3 7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v2.25a1.5 1.5 0 000 3V16.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5v-3.75a1.5 1.5 0 000-3V7.5z',
      // },
      {
        category: 'Gaming',
        label: 'Game',
        iconColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/15 border-cyan-500/30',
        svg: 'M15 6H9a5 5 0 00-5 5v3a3 3 0 003 3h.5a2.5 2.5 0 002.3-1.5l.7-1.5h3l.7 1.5a2.5 2.5 0 002.3 1.5h.5a3 3 0 003-3v-3a5 5 0 00-5-5zM6 11.5h4M8 9.5v4M15 11.5h.01M17 13.5h.01',
      },
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
        svgPath: cfg.svg,
      };
    });

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
        label: option.label,
        average,
        count,
        iconColorClass: 'text-purple-400',
        bgColorClass: 'bg-purple-500/15 border-purple-500/30',
        svgPath:
          'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18M3 7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v2.25a1.5 1.5 0 000 3V16.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5v-3.75a1.5 1.5 0 000-3V7.5z',
      } satisfies CategoryAverage;
    });

    return [...categorySummaries, ...ticketSubcategories];
  });
}
