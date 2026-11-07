import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import {
  comparePendingTransactionsByDate,
  getPendingTransactionTotalAmount,
  PendingTransaction,
  TransactionService,
} from '../../services/transaction-service';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { KioskRequestEditorComponent } from './kiosk-request-editor.component';

/** Kiosk: requests the admin sent, waiting to be filled in. */
@Component({
  selector: 'app-kiosk-requests',
  standalone: true,
  imports: [CommonModule, SensitiveDirective, KioskRequestEditorComponent],
  host: { class: 'block' },
  template: `
    @if (selected(); as request) {
      <app-kiosk-request-editor
        [request]="request"
        (back)="selected.set(null)"
        (done)="onDone($event)"
      />
    } @else {
      <section aria-labelledby="kiosk-requests-heading" class="flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 id="kiosk-requests-heading" class="type-wide text-[13px] font-semibold uppercase text-ink-2">
              Requests
            </h2>
            <p class="mt-1 text-[13px] text-ink-3">Fill in the amount and send them back.</p>
          </div>
          <button
            type="button"
            class="-mr-2 min-h-11 rounded-xl px-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            [disabled]="requestsQuery.isFetching()"
            (click)="refresh()"
          >
            {{ requestsQuery.isFetching() ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        @if (doneMessage(); as message) {
          <p role="status" class="text-[13px] font-medium text-avocado-ink">{{ message }}</p>
        }

        @if (requestsQuery.isPending()) {
          <ul class="animate-pulse divide-y divide-ink/10" aria-label="Loading requests">
            @for (item of [1, 2]; track item) {
              <li class="py-3"><span class="block h-4 w-44 rounded bg-raised"></span></li>
            }
          </ul>
        } @else if (requestsQuery.isError()) {
          <p role="alert" class="rounded-xl border border-cherry/30 bg-cherry-deep/60 px-3.5 py-3 text-[13px] text-cherry">
            Couldn't load your requests. Check your connection and try again.
          </p>
        } @else if (requests().length === 0) {
          <p class="border-y border-ink/10 py-6 text-[13px] text-ink-3">No requests right now.</p>
        } @else {
          <ul class="divide-y divide-ink/10 border-y border-ink/10">
            @for (request of requests(); track request.id) {
              <li>
                <button
                  type="button"
                  class="flex min-h-14 w-full items-center justify-between gap-3 py-2.5 text-left cursor-pointer"
                  (click)="open(request)"
                >
                  <span class="min-w-0">
                    <span class="block truncate text-[14px] text-ink">{{ request.description }}</span>
                    <span class="mt-0.5 block truncate text-[12px] text-ink-3">
                      {{ request.date | date: 'd MMM' }} · {{ request.category }}
                      @if (request.comment) {
                        · <span class="italic text-ink-2">"{{ request.comment }}"</span>
                      }
                    </span>
                  </span>
                  <span class="flex shrink-0 items-center gap-2">
                    @if (amount(request) > 0) {
                      <span class="text-[13px] font-medium text-ink tabular-nums" appSensitive="xs">
                        €{{ amount(request) | number: '1.2-2' }}
                      </span>
                    } @else {
                      <span class="text-[13px] font-semibold text-ember-ink">Add amount</span>
                    }
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
      </section>
    }
  `,
})
export class KioskRequestsComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly queryClient = inject(QueryClient);

  readonly requestsQuery = this.transactionService.getKioskRequestsQuery();
  // A snapshot, so a background refetch can't swap the request out mid-edit.
  readonly selected = signal<PendingTransaction | null>(null);
  readonly doneMessage = signal<string | null>(null);

  readonly requests = computed(() =>
    [...(this.requestsQuery.data() ?? [])].sort(comparePendingTransactionsByDate),
  );
  readonly amount = getPendingTransactionTotalAmount;

  private doneTimer?: ReturnType<typeof setTimeout>;

  open(request: PendingTransaction): void {
    this.doneMessage.set(null);
    this.selected.set(request);
  }

  refresh(): void {
    void this.queryClient.invalidateQueries({ queryKey: ['kioskRequests'] });
  }

  onDone(message: string): void {
    this.selected.set(null);
    this.doneMessage.set(message);
    clearTimeout(this.doneTimer);
    this.doneTimer = setTimeout(() => this.doneMessage.set(null), 2500);
  }
}
