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
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-gray-200">Requests</h2>
            <p class="text-[11px] text-gray-500">Fill in the amount and send them back.</p>
          </div>
          <button
            type="button"
            (click)="refresh()"
            [disabled]="requestsQuery.isFetching()"
            class="text-xs font-medium text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {{ requestsQuery.isFetching() ? 'Refreshing…' : '↻ Refresh' }}
          </button>
        </div>

        @if (doneMessage(); as message) {
          <p
            class="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs text-center"
          >
            {{ message }}
          </p>
        }

        @if (requestsQuery.isPending()) {
          <div class="space-y-2 animate-pulse">
            @for (item of [1, 2]; track item) {
              <div class="h-14 rounded-xl bg-gray-800/60"></div>
            }
          </div>
        } @else if (requestsQuery.isError()) {
          <p class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
            Unable to load requests.
          </p>
        } @else if (requests().length === 0) {
          <div class="py-10 text-center space-y-1">
            <p class="text-2xl">📭</p>
            <p class="text-xs text-gray-500">No requests right now.</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (request of requests(); track request.id) {
              <button
                type="button"
                (click)="open(request)"
                class="w-full text-left rounded-xl border border-gray-800/80 bg-gray-900/60 px-3 py-2.5 hover:border-gray-700 hover:bg-gray-800/40 transition-colors cursor-pointer"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <span class="block truncate text-xs font-medium text-gray-200">
                      {{ request.description }}
                    </span>
                    <div class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
                      <span>{{ request.date | date: 'dd/MM/yyyy' }}</span>
                      <span>{{ request.category }}</span>
                    </div>
                    @if (request.comment) {
                      <p class="mt-1 text-[11px] text-gray-400 line-clamp-2">
                        💬 {{ request.comment }}
                      </p>
                    }
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    @if (amount(request) > 0) {
                      <span class="text-xs font-semibold text-white tabular-nums" appSensitive>
                        €{{ amount(request) | number: '1.2-2' }}
                      </span>
                    } @else {
                      <span class="text-[11px] font-medium text-amber-300">Add amount</span>
                    }
                    <span class="text-gray-500" aria-hidden="true">›</span>
                  </div>
                </div>
              </button>
            }
          </div>
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
