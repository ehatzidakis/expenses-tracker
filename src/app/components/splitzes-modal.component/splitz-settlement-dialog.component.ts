import { Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { DebtEntry } from '../../models/splitz.model';
import { participantName } from './pending-review.model';

export interface SettlementConfirmation {
  personId: number;
  debts: DebtEntry[];
  netWithMe: number;
}

@Component({
  selector: 'app-splitz-settlement-dialog',
  standalone: true,
  template: `
    <dialog
      #dialog
      (cancel)="$event.preventDefault(); cancelled.emit()"
      aria-labelledby="settlement-title"
      class="m-auto outline-none focus:outline-none w-[calc(100%-2rem)] max-w-md max-h-[85vh] bg-transparent p-0 text-current backdrop:bg-black/75 backdrop:backdrop-blur-xs"
    >
      @if (confirmation(); as c) {
        <div
          class="bg-gray-900 border border-gray-800/90 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 id="settlement-title" class="text-sm font-semibold text-gray-100">
                Settle up with {{ name(c.personId) }}
              </h3>
              <p class="text-xs text-gray-400 mt-1">Marks every open split between you as paid.</p>
            </div>
            <button
              type="button"
              (click)="cancelled.emit()"
              aria-label="Close settlement confirmation"
              class="h-8 w-8 shrink-0 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <div class="p-4 rounded-xl bg-gray-950/60 border border-gray-800 text-center">
            <p class="text-3xl font-bold tabular-nums text-white">
              €{{ abs(c.netWithMe).toFixed(2) }}
            </p>
            <p
              class="mt-1 text-xs font-medium"
              [class.text-emerald-400]="c.netWithMe > 0"
              [class.text-amber-400]="c.netWithMe < 0"
            >
              {{ c.netWithMe > 0 ? name(c.personId) + ' owes you' : 'You owe ' + name(c.personId) }}
            </p>
          </div>

          <div class="rounded-xl border border-gray-800/80 bg-gray-950/30 p-3">
            <button
              type="button"
              (click)="showTransactions.update((value) => !value)"
              [attr.aria-expanded]="showTransactions()"
              class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-200 cursor-pointer"
            >
              <span>Transactions included ({{ c.debts.length }})</span>
              <span class="text-gray-400">{{ showTransactions() ? 'Hide' : 'Show' }}</span>
            </button>

            @if (showTransactions()) {
              <div class="mt-3 max-h-60 overflow-y-auto space-y-2 border-t border-gray-800/70 pt-3">
                @for (
                  debt of c.debts;
                  track debt.transactionId + '-' + debt.debtorId + '-' + debt.creditorId
                ) {
                  <div
                    class="settlement-transaction-card rounded-lg border px-3 py-2"
                    [class.border-teal-500/40]="debt.creditorId === 'me'"
                    [class.bg-teal-950/20]="debt.creditorId === 'me'"
                    [class.border-amber-500/40]="debt.creditorId !== 'me'"
                    [class.bg-amber-950/20]="debt.creditorId !== 'me'"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-xs text-gray-200">{{ debt.description }}</p>
                        <p class="mt-0.5 text-[10px] text-gray-500">
                          {{ debt.date }} · {{ payerLabel(debt.creditorId) }} paid
                        </p>
                      </div>
                      <div class="shrink-0 text-right tabular-nums">
                        <p class="text-xs font-semibold text-gray-100">
                          Owed: €{{ debt.amount.toFixed(2) }}
                        </p>
                        <p class="mt-0.5 text-[10px] text-gray-500">
                          Full amount: €{{ debt.transactionTotalAmount.toFixed(2) }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <textarea
            rows="2"
            [value]="note()"
            (input)="note.set($any($event.target).value)"
            placeholder="Optional note"
            class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/60 resize-none"
          ></textarea>

          @if (error()) {
            <p
              role="alert"
              class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs"
            >
              {{ error() }}
            </p>
          }

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700/80 active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmed.emit(note())"
              [disabled]="busy()"
              class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-br from-teal-500 to-emerald-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
            >
              {{ busy() ? 'Settling…' : 'Confirm settlement' }}
            </button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class SplitzSettlementDialogComponent {
  readonly confirmation = input<SettlementConfirmation | null>(null);
  readonly busy = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  readonly showTransactions = signal(false);
  readonly note = signal('');

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) return;

      if (this.confirmation()) {
        this.note.set('');
        this.showTransactions.set(false);
        if (!dialog.open) {
          if (typeof dialog.showModal === 'function') dialog.showModal();
          else dialog.setAttribute('open', '');
        }
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  name(id: 'me' | number): string {
    return participantName(id);
  }

  payerLabel(id: 'me' | number): string {
    return id === 'me' ? 'I' : participantName(id);
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}
