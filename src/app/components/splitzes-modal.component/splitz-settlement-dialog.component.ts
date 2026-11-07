import { Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DebtEntry } from '../../models/splitz.model';
import { participantName } from './pending-review.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import {
  BUTTON_PRIMARY,
  DIALOG,
  DIALOG_PANEL,
  ERROR_WELL,
  FIELD,
  FIELD_LABEL,
  BUTTON_SECONDARY_LG,
} from '../../utils/pill-styles';
export interface SettlementConfirmation {
  personId: number;
  debts: DebtEntry[];
  netWithMe: number;
}

@Component({
  selector: 'app-splitz-settlement-dialog',
  standalone: true,
  imports: [DatePipe, SensitiveDirective],
  template: `
    <dialog
      #dialog
      (cancel)="$event.preventDefault(); cancelled.emit()"
      aria-labelledby="settlement-title"
      [class]="dialogClass"
    >
      @if (confirmation(); as c) {
        <div [class]="panelClass + ' max-h-[85dvh] overflow-y-auto'">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 id="settlement-title" class="type-wide text-[18px] font-semibold text-ink">
                Settle up with {{ name(c.personId) }}
              </h3>
              <p class="mt-1 text-[14px] text-ink-2">Marks every open split between you as paid.</p>
            </div>
            <button
              type="button"
              (click)="cancelled.emit()"
              aria-label="Close settlement confirmation"
              class="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-ink cursor-pointer"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div class="mt-5">
            <p class="type-wide text-[clamp(30px,9vw,40px)] font-bold leading-none tracking-[-0.02em] text-ink" appSensitive>
              €{{ abs(c.netWithMe).toFixed(2) }}
            </p>
            <p class="mt-2 text-[13px]" [class]="c.netWithMe > 0 ? 'font-medium text-avocado-ink' : 'text-ink-2'">
              {{ c.netWithMe > 0 ? name(c.personId) + ' owes you' : 'You owe ' + name(c.personId) }}
            </p>
          </div>

          <div class="mt-4 border-y border-ink/10">
            <button
              type="button"
              (click)="showTransactions.update((value) => !value)"
              [attr.aria-expanded]="showTransactions()"
              class="flex min-h-12 w-full items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span class="text-[14px] font-medium text-ink-2">Transactions included ({{ c.debts.length }})</span>
              <svg
                class="size-3.5 shrink-0 text-ink-3 transition-transform duration-200"
                [class.rotate-180]="showTransactions()"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                />
              </svg>
            </button>

            @if (showTransactions()) {
              <ul class="max-h-60 divide-y divide-ink/10 overflow-y-auto border-t border-ink/10">
                @for (
                  debt of c.debts;
                  track debt.transactionId + '-' + debt.debtorId + '-' + debt.creditorId
                ) {
                  <li
                    class="settlement-debt-row flex items-start justify-between gap-3 py-2.5"
                    [attr.data-payer]="debt.creditorId === 'me' ? 'me' : 'them'"
                  >
                    <div class="min-w-0">
                      <p class="truncate text-[14px] text-ink">{{ debt.description }}</p>
                      <p class="mt-0.5 text-[12px] text-ink-3">
                        {{ debt.date | date: 'd MMM' }} · {{ payerLabel(debt.creditorId) }} paid
                      </p>
                    </div>
                    <div class="shrink-0 text-right tabular-nums">
                      <p
                        class="settlement-owed text-[13px] font-medium"
                        [class]="debt.creditorId === 'me' ? 'text-avocado-ink' : 'text-ink'"
                        appSensitive="xs"
                      >
                        {{ debt.creditorId === 'me' ? 'Owes you' : 'You owe' }} €{{ debt.amount.toFixed(2) }}
                      </p>
                      <p class="mt-0.5 text-[12px] text-ink-3" appSensitive="xs">
                        Full amount: €{{ debt.transactionTotalAmount.toFixed(2) }}
                      </p>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="mt-4 flex flex-col gap-1.5">
            <label for="settlement-note" [class]="fieldLabel">Note (optional)</label>
            <textarea
              id="settlement-note"
              rows="2"
              [value]="note()"
              (input)="note.set($any($event.target).value)"
              placeholder="For example: paid by bank transfer"
              [class]="field + ' resize-none py-3'"
            ></textarea>
          </div>

          @if (error()) {
            <p role="alert" [class]="errorWell + ' mt-4'">{{ error() }}</p>
          }

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button type="button" [class]="secondaryLg" (click)="cancelled.emit()">
              Cancel
            </button>
            <button type="button" [class]="primary" [disabled]="busy()" (click)="confirmed.emit(note())">
              {{ busy() ? 'Settling…' : 'Confirm' }}
            </button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class SplitzSettlementDialogComponent {
  protected readonly secondaryLg = BUTTON_SECONDARY_LG;
  protected readonly dialogClass = DIALOG;
  protected readonly panelClass = DIALOG_PANEL;
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly errorWell = ERROR_WELL;
  protected readonly primary = BUTTON_PRIMARY;

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
