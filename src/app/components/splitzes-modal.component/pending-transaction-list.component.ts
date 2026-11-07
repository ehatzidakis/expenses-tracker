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
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <p class="text-[13px] text-ink-2">
          {{ items().length }} pending
          @if (withKioskCount() > 0) {
            <span class="text-ink-3">· {{ withKioskCount() }} with kiosk</span>
          }
        </p>
        <button
          type="button"
          class="-mr-2 min-h-11 rounded-xl px-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          [disabled]="refreshing()"
          (click)="refresh.emit()"
        >
          {{ refreshing() ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>

      @if (loading()) {
        <ul class="animate-pulse divide-y divide-ink/10" aria-label="Loading incoming">
          @for (item of [1, 2, 3]; track item) {
            <li class="py-3"><span class="block h-4 w-44 rounded bg-raised"></span></li>
          }
        </ul>
      } @else if (error()) {
        <p role="alert" class="rounded-xl border border-cherry/30 bg-cherry-deep/60 px-3.5 py-3 text-[13px] text-cherry">
          Couldn't load incoming items. Check your connection and try again.
        </p>
      } @else if (items().length === 0) {
        <p class="border-y border-ink/10 py-6 text-[13px] text-ink-3">Nothing to review right now.</p>
      } @else {
        <ul class="divide-y divide-ink/10 border-y border-ink/10">
          @for (pending of items(); track pending.id) {
            <li>
              <button
                type="button"
                class="pending-row flex min-h-14 w-full items-center justify-between gap-3 py-2.5 text-left cursor-pointer"
                (click)="select.emit(pending)"
              >
                <span class="min-w-0">
                  <span class="flex items-center gap-1.5 text-[14px] text-ink">
                    <span class="truncate">{{ pending.description }}</span>
                    @if (pending.isSplit || pending.sourceRole === 'kiosk') {
                      <svg
                        class="size-3.5 shrink-0 text-ink-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        role="img"
                        aria-label="Split transaction"
                      >
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
                      </svg>
                    }
                    @if (pending.comment) {
                      <svg
                        class="size-3.5 shrink-0 text-ink-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        role="img"
                        aria-label="Has comment"
                      >
                        <path d="M4 5h16v11H9l-5 4z" />
                      </svg>
                    }
                  </span>
                  <span class="mt-0.5 block truncate text-[12px] text-ink-3">
                    {{ pending.date | date: 'd MMM' }} · {{ pending.category }} · {{ sourceLabel(pending) }}
                    @if (statusLabel(pending); as status) {
                      ·
                      <span
                        [class.text-ink-2]="pending.requestStatus === 'awaiting-kiosk'"
                        [class.text-avocado-ink]="pending.requestStatus === 'answered'"
                        [class.text-cherry]="pending.requestStatus === 'declined'"
                        >{{ status }}</span
                      >
                    }
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2">
                  <span class="text-[13px] font-medium text-ink tabular-nums" appSensitive="xs">
                    €{{ totalAmount(pending) | number: '1.2-2' }}
                  </span>
                  <svg class="size-4 text-ink-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    />
                  </svg>
                </span>
              </button>
            </li>
          }
        </ul>
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
  readonly withKioskCount = computed(() => this.items().filter(isAwaitingKiosk).length);
}
