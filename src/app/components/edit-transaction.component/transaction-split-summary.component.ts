import { Component, computed, input } from '@angular/core';
import { Transaction } from '../../models/transaction.model';
import { PEOPLE } from '../../models/splitz.model';
import { computeSplitDebtEntries } from '../../services/splitz.service';

function personName(id: 'me' | number | undefined): string {
  if (id === 'me') return 'You';
  if (id === undefined) return 'Unknown';
  return PEOPLE.find((person) => person.id === id)?.name ?? `Person ${id}`;
}

/** Read-only view of a split whose money is locked because someone has settled. */
@Component({
  selector: 'app-transaction-split-summary',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-medium text-gray-400">Splitzes</span>
        <span class="text-[11px] text-amber-300">🔒 Partly settled — amounts locked</span>
      </div>

      <div
        class="bg-gray-800/40 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-300 space-y-2"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-gray-400">{{ typeLabel() }} · paid by {{ paidByLabel() }}</span>
          <span class="tabular-nums">€{{ total().toFixed(2) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-gray-400">Your share</span>
          <span class="tabular-nums">€{{ transaction().amount.toFixed(2) }}</span>
        </div>

        @for (debt of debts(); track $index) {
          <div
            class="flex items-center justify-between gap-3 border-t border-gray-800 pt-2 text-xs"
          >
            <span [class.text-gray-500]="debt.paid">
              {{ debt.label }}
              @if (debt.paid) {
                <span class="text-teal-400">✓ settled</span>
              }
            </span>
            <span class="tabular-nums" [class.text-gray-500]="debt.paid"
              >€{{ debt.amount.toFixed(2) }}</span
            >
          </div>
        }
      </div>
    </div>
  `,
})
export class TransactionSplitSummaryComponent {
  readonly transaction = input.required<Transaction>();

  readonly total = computed(() => this.transaction().totalAmount ?? this.transaction().amount);
  readonly typeLabel = computed(() =>
    this.transaction().splitType === 'custom' ? 'Custom split' : 'Halfsies',
  );
  readonly paidByLabel = computed(() =>
    this.transaction().paidBy === 'me' ? 'you' : personName(this.transaction().paidBy),
  );
  readonly debts = computed(() =>
    computeSplitDebtEntries(this.transaction()).map((debt) => ({
      label: `${personName(debt.debtorId)} ${debt.debtorId === 'me' ? 'owe' : 'owes'} ${
        debt.creditorId === 'me' ? 'you' : personName(debt.creditorId)
      }`,
      amount: debt.amount,
      paid: debt.paid,
    })),
  );
}
