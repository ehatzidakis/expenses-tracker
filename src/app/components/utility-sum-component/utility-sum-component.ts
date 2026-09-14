import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';
import { PagedEntriesListComponent } from '../paged-entries-list/paged-entries-list';

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
  imports: [CommonModule, PagedEntriesListComponent],
  templateUrl: './utility-sum-component.html',
})
export class UtilitySumComponent {
  private readonly transactionService = inject(TransactionService);

  // Local signal to hold the fetched utilities
  private readonly utilityTxs = signal<Transaction[]>([]);
  readonly expandedUtility = signal<string | null>(null);
  readonly viewMode = signal<'bill' | 'monthly'>('monthly');

  ngOnInit() {
    this.loadUtilities();
  }

  async loadUtilities() {
    try {
      const txs = await this.transactionService.fetchAllUtilityTransactions();
      this.utilityTxs.set(txs);
    } catch (error) {
      console.error('Failed to load utility transactions', error);
    }
  }

  toggleUtility(label: string): void {
    this.expandedUtility.update((current) => (current === label ? null : label));
  }

  readonly utilityAverages = computed<UtilityAverage[]>(() => {
    const transactions = this.utilityTxs();
    const mode = this.viewMode();

    const targets = [
      {
        id: 12,
        label: 'Energy',
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-500/15 border-amber-500/30',
        svg: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
        freq: '/monthly',
        billMonths: 1,
      },
      {
        id: 14,
        label: 'Internet',
        iconColor: 'text-indigo-400',
        bgColor: 'bg-indigo-500/15 border-indigo-500/30',
        svg: 'M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z',
        freq: '/bi-monthly',
        billMonths: 2,
      },
      {
        id: 15,
        label: 'Mobile',
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/15 border-emerald-500/30',
        svg: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
        freq: '/monthly',
        billMonths: 1,
      },
      {
        id: 16,
        label: 'Water',
        iconColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/15 border-cyan-500/30',
        svg: 'M12 2.25c0 0-6.75 8.25-6.75 13.5a6.75 6.75 0 0013.5 0C18.75 10.5 12 2.25 12 2.25z',
        freq: '/tri-monthly',
        billMonths: 3,
      },
      {
        id: 13,
        label: 'Κοινόχρηστα',
        iconColor: 'text-violet-400',
        bgColor: 'bg-violet-500/15 border-violet-500/30',
        svg: 'M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.527.526.823 1.25.823 2.004z',
        freq: '/monthly',
        billMonths: 1,
      },
      {
        id: 17,
        label: 'Other',
        iconColor: 'text-slate-400',
        bgColor: 'bg-slate-500/15 border-slate-500/30',
        svg: 'M12 2.25A9.75 9.75 0 1021.75 12 9.75 9.75 0 0012 2.25zm.75 5.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.5 3h1.5v6h-1.5z',
        freq: '/monthly',
        billMonths: 1,
      },
      {
        id: 18,
        label: 'Taxes',
        iconColor: 'text-rose-400',
        bgColor: 'bg-rose-500/15 border-rose-500/30',
        svg: 'M7.5 4.5h9a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0116.5 19.5h-9A2.25 2.25 0 015 17.25V6.75A2.25 2.25 0 017.5 4.5zm9 3.75h-9M9 12h6M9 15h6',
        freq: '/monthly',
        billMonths: 1,
      },
    ];

    return targets.map((target) => {
      const matches = transactions.filter((tx) => {
        const subCategoryId = tx.subCategoryId != null ? Number(tx.subCategoryId) : null;
        return subCategoryId != null && subCategoryId === target.id;
      });

      const count = matches.length;
      const sum = matches.reduce((acc, curr) => acc + Number(curr.amount), 0);
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
