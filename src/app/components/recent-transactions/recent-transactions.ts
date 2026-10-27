import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { PEOPLE } from '../../models/splitz.model';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction-service';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <section class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 backdrop-blur-sm">
      <button
        type="button"
        class="w-full flex items-center justify-between text-left"
        [attr.aria-expanded]="expanded()"
        aria-controls="recent-transactions-list"
        (click)="expanded.update((value) => !value)"
      >
        <span>
          <span class="text-sm font-semibold text-gray-200 block">Latest transactions</span>
          <!-- <span class="text-[10px] text-gray-500">{{ transactions().length }} of 10 shown</span> -->
        </span>
        <span class="text-xs text-gray-400">{{ expanded() ? 'Hide' : 'Show' }}</span>
      </button>

      @if (expanded()) {
        <div id="recent-transactions-list" class="mt-3 border-t border-gray-800/70 pt-3">
          @if (loading()) {
            <div class="space-y-2 animate-pulse">
              @for (item of [1, 2, 3]; track item) {
                <div class="h-14 rounded-xl bg-gray-800/60"></div>
              }
            </div>
          } @else if (error()) {
            <p class="text-xs text-red-300">Unable to load recent transactions.</p>
          } @else if (!transactions().length) {
            <p class="text-xs text-gray-500">No transactions yet.</p>
          } @else {
            <div class="space-y-2">
              @for (transaction of transactions(); track transaction.id) {
                <article class="rounded-xl border border-gray-800/80 bg-gray-950/30 px-3 py-2.5">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="truncate text-xs font-medium text-gray-200">
                          {{ transaction.description }}
                        </span>
                        @if (transaction.isSplit) {
                          <span title="Split transaction" aria-label="Split transaction">✂️</span>
                        }
                        @if (transaction.comment) {
                          <span title="Has comment" aria-label="Has comment">💬</span>
                        }
                      </div>
                      <div class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
                        <span>{{ transaction.date | date: 'dd/MM/yyyy' }}</span>
                        @if (transaction.createdAt) {
                          <span>Added {{ transaction.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                        }
                        <span>{{ transaction.category }}</span>
                        @if (transaction.subCategory) {
                          <span>{{ transaction.subCategory }}</span>
                        }
                        <span>{{ transaction.monthName }}</span>
                      </div>
                    </div>
                    <span class="shrink-0 text-xs font-semibold text-white tabular-nums">
                      €{{ transaction.amount | number: '1.2-2' }}
                    </span>
                  </div>
                  @if (transaction.isSplit) {
                    <div class="mt-2 text-[10px] text-gray-500">
                      Total €{{ transaction.totalAmount ?? transaction.amount | number: '1.2-2' }} ·
                      Paid by {{ personName(transaction.paidBy) }} ·
                      {{ transaction.splitType === 'custom' ? 'Custom split' : 'Split' }}
                      @if (transaction.splitBy?.length) {
                        · With {{ personNames(transaction.splitBy) }}
                      }
                      @if (transaction.splitPaidPersonIds?.length) {
                        · {{ transaction.splitPaidPersonIds?.length }} settled
                      }
                    </div>
                    @if (transaction.customSplitAmounts) {
                      <div class="mt-1 text-[10px] text-gray-500">
                        Shares:
                        @for (
                          share of splitShares(transaction.customSplitAmounts);
                          track share[0]
                        ) {
                          {{ personName(share[0]) }} €{{ share[1] | number: '1.2-2' }}
                        }
                      </div>
                    }
                  }
                  @if (transaction.comment) {
                    <p class="mt-2 text-[10px] text-gray-400">{{ transaction.comment }}</p>
                  }
                </article>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class RecentTransactionsComponent {
  private readonly transactionService = inject(TransactionService);

  readonly monthName = input<string | null>(null);
  readonly adjustmentId = input<string | null>(null);
  readonly expanded = signal(false);
  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  constructor() {
    effect(() => {
      const monthName = this.monthName();
      const adjustmentId = this.adjustmentId();
      if (!monthName && !adjustmentId) return;
      void this.loadTransactions(monthName, adjustmentId);
    });
  }

  personName(id: 'me' | number | undefined): string {
    if (id === 'me') return 'me';
    if (id === undefined) return 'unknown';
    return PEOPLE.find((person) => person.id === id)?.name ?? `Person ${id}`;
  }

  personNames(ids: number[]): string {
    return ids.map((id) => this.personName(id)).join(', ');
  }

  splitShares(amounts: Partial<Record<'me' | number, number>>): Array<['me' | number, number]> {
    return Object.entries(amounts).map(([id, amount]) => [
      id === 'me' ? 'me' : Number(id),
      Number(amount) || 0,
    ]);
  }

  private async loadTransactions(
    monthName: string | null,
    adjustmentId: string | null,
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    this.transactions.set([]);
    try {
      this.transactions.set(
        await this.transactionService.fetchRecentTransactions({
          monthName: monthName ?? undefined,
          adjustmentId: adjustmentId ?? undefined,
        }),
      );
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
