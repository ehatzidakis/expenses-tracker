import { Component, computed, input } from '@angular/core';
import { Transaction } from '../../models/transaction.model';
import { PEOPLE } from '../../models/splitz.model';
import { computeSplitDebtEntries } from '../../services/splitz.service';
import { SensitiveDirective } from '../../utils/sensitive.directive';

function personName(id: 'me' | number | undefined): string {
  if (id === 'me') return 'You';
  if (id === undefined) return 'Unknown';
  return PEOPLE.find((person) => person.id === id)?.name ?? `Person ${id}`;
}

/** Read-only view of a split whose money is locked because someone has settled. */
@Component({
  selector: 'app-transaction-split-summary',
  standalone: true,
  imports: [SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-[13px] font-medium text-ink-2">Splitzes</span>
        <span class="text-[12px] text-ink-3">Partly settled · amounts locked</span>
      </div>

      <div class="divide-y divide-ink/10 border-y border-ink/10 text-[13px] text-ink-2">
        <div class="flex items-center justify-between gap-3 py-2.5">
          <span class="text-ink-2">{{ typeLabel() }} · paid by {{ paidByLabel() }}</span>
          <span class="tabular-nums" appSensitive>€{{ total().toFixed(2) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 py-2.5">
          <span class="text-ink-2">Your share</span>
          <span class="tabular-nums" appSensitive>€{{ transaction().amount.toFixed(2) }}</span>
        </div>

        @for (debt of debts(); track $index) {
          <div class="flex items-center justify-between gap-3 py-2.5">
            <span [class.text-ink-3]="debt.paid">
              {{ debt.label }}
              @if (debt.paid) {
                <span class="debt-settled ml-1 text-avocado-ink">· Settled</span>
              }
            </span>
            <span class="tabular-nums" [class.text-ink-3]="debt.paid" appSensitive
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
