import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  getPendingTransactionTotalAmount,
  PendingTransaction,
} from '../../services/transaction-service';
import { isAwaitingKiosk, pendingSourceLabel, pendingStatusLabel } from './pending-review.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';

@Component({
  selector: 'app-pending-transaction-list',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-400">{{ reviewCount() }} waiting for review</p>
        <button
          type="button"
          (click)="refresh.emit()"
          [disabled]="refreshing()"
          class="text-xs font-medium text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {{ refreshing() ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>

      @if (loading()) {
        <div class="space-y-2 animate-pulse">
          @for (item of [1, 2, 3]; track item) {
            <div class="h-14 rounded-xl bg-gray-800/60"></div>
          }
        </div>
      } @else if (error()) {
        <p class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
          Unable to load incoming transactions.
        </p>
      } @else if (items().length === 0) {
        <div class="py-8 text-center space-y-1">
          <p class="text-2xl">📭</p>
          <p class="text-xs text-gray-500">Nothing to review right now.</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (pending of items(); track pending.id) {
            <button
              type="button"
              (click)="select.emit(pending)"
              class="pending-row w-full text-left rounded-xl border border-gray-800/80 bg-gray-950/30 px-3 py-2.5 hover:border-gray-700 hover:bg-gray-800/40 transition-colors cursor-pointer"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-xs font-medium text-gray-200">
                      {{ pending.description }}
                    </span>
                    @if (pending.isSplit || pending.sourceRole === 'kiosk') {
                      <span title="Split transaction" aria-label="Split transaction">✂️</span>
                    }
                    @if (pending.comment) {
                      <span title="Has comment" aria-label="Has comment">💬</span>
                    }
                  </div>
                  <div class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
                    <span>{{ pending.date | date: 'dd/MM/yyyy' }}</span>
                    <span>{{ pending.category }}</span>
                    <span class="text-amber-300/80">{{ sourceLabel(pending) }}</span>
                    @if (statusLabel(pending); as status) {
                      <span
                        class="truncate max-w-full"
                        [class.text-sky-300]="pending.requestStatus === 'awaiting-kiosk'"
                        [class.text-emerald-300]="pending.requestStatus === 'answered'"
                        [class.text-red-300]="pending.requestStatus === 'declined'"
                      >
                        {{ status }}
                      </span>
                    }
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-xs font-semibold text-white tabular-nums" appSensitive>
                    €{{ totalAmount(pending) | number: '1.2-2' }}
                  </span>
                  <span class="text-gray-500" aria-hidden="true">›</span>
                </div>
              </div>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class PendingTransactionListComponent {
  readonly items = input.required<PendingTransaction[]>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly refreshing = input(false);

  readonly select = output<PendingTransaction>();
  readonly refresh = output<void>();

  readonly totalAmount = getPendingTransactionTotalAmount;
  readonly sourceLabel = pendingSourceLabel;
  readonly statusLabel = pendingStatusLabel;
  // Requests still with the kiosk are listed but aren't waiting for the admin.
  readonly reviewCount = computed(() => this.items().filter((p) => !isAwaitingKiosk(p)).length);
}
