import { Component, effect, inject, input, signal } from '@angular/core';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { CATEGORY_BUDGETS, CategorySpend } from '../../services/expense-state.service';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';
import { YearlyCategorySumsComponent } from '../yearly-category-sums/yearly-category-sums';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction-service';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [
    CommonModule,
    TransactionGridComponent,
    EditTransactionComponent,
    YearlyCategorySumsComponent,
  ],
  host: { class: 'block' },
  templateUrl: './category-breakdown.component.html',
})
export class CategoryBreakdownComponent {
  private readonly transactionService = inject(TransactionService);

  categories = input.required<CategorySpend[]>();
  monthName = input<string>('');
  selectedTransaction = signal<Transaction | null>(null);

  readonly expandedCategory = signal<string | null>(null);
  readonly transactionCounts = signal<Record<string, number>>({});

  protected readonly Math = Math;

  private readonly categoryIcons: Record<string, { emoji: string; classes: string }> = {
    Supermarket: {
      emoji: '🛒',
      classes: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20',
    },
    Medical: {
      emoji: '❤️‍🩹',
      classes: 'bg-rose-500/15 text-rose-200 border border-rose-400/20',
    },
    Personal: {
      emoji: '👤',
      classes: 'bg-violet-500/15 text-violet-200 border border-violet-400/20',
    },
    EatingOut: {
      emoji: '🍽️',
      classes: 'bg-amber-500/15 text-amber-200 border border-amber-400/20',
    },
    Utilities: {
      emoji: '💡',
      classes: 'bg-yellow-500/15 text-yellow-200 border border-yellow-400/20',
    },
    Takeaway: {
      emoji: '🍖',
      classes: 'bg-orange-500/15 text-orange-200 border border-orange-400/20',
    },
    Tickets: {
      emoji: '🎟️',
      classes: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
    },
    Gaming: {
      emoji: '🎮',
      classes: 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20',
    },
    Cats: {
      emoji: '🐾',
      classes: 'bg-pink-500/15 text-pink-200 border border-pink-400/20',
    },
    Travel: {
      emoji: '🚅',
      classes: 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/20',
    },
    Subscriptions: {
      emoji: '📺',
      classes: 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20',
    },
    Gym: {
      emoji: '🏋️',
      classes: 'bg-teal-500/15 text-teal-200 border border-teal-400/20',
    },
  };

  constructor() {
    effect(() => {
      const month = this.monthName();
      const currentCategories = this.categories();

      if (!month || currentCategories.length === 0) {
        this.transactionCounts.set({});
        return;
      }

      void this.loadTransactionCounts(month, currentCategories);
    });
  }

  categoryMeta(name: string): { emoji: string; classes: string } {
    return (
      this.categoryIcons[name] ?? {
        emoji: '•',
        classes: 'bg-slate-500/15 text-slate-200 border border-slate-400/20',
      }
    );
  }

  private async loadTransactionCounts(
    month: string,
    currentCategories: CategorySpend[],
  ): Promise<void> {
    const counts: Record<string, number> = {};

    for (const category of currentCategories) {
      counts[category.name] = await this.transactionService.countTransactions(month, category.name);
    }

    this.transactionCounts.set(counts);
  }

  toggleCategory(name: string): void {
    this.selectedTransaction.set(null);
    this.expandedCategory.update((current) => (current === name ? null : name));
  }

  onSelectTransaction(tx: Transaction): void {
    console.log('Parent received selected transaction:', tx);
    this.selectedTransaction.set(tx);
  }

  onEditFinished(): void {
    this.selectedTransaction.set(null);
    // Optional: trigger grid refresh if needed
  }
}
