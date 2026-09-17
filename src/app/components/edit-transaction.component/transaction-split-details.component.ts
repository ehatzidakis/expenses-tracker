import { Component, input } from '@angular/core';

export interface TransactionSplitDetails {
  paidBy: 'me' | number | undefined;
  splitBy: number[];
  splitType: 'split' | 'custom';
  totalAmount: number;
  splitPaidPersonIds: number[];
}

@Component({
  selector: 'app-transaction-split-details',
  standalone: true,
  template: `
    <div class="rounded-2xl border border-teal-800/40 bg-teal-950/20 p-3 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wide text-teal-300">Split Details</p>
        <span class="text-[10px] font-medium px-2 py-1 rounded-full bg-teal-500/10 text-teal-200">
          Read only
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs text-gray-300">
        <div>
          <p class="text-gray-400">Split Type</p>
          <p class="mt-1 font-medium text-white">{{ splitTypeLabel()(details().splitType) }}</p>
        </div>
        <div>
          <p class="text-gray-400">Paid By</p>
          <p class="mt-1 font-medium text-white">{{ personName()(details().paidBy) }}</p>
        </div>
        <div class="col-span-2">
          <p class="text-gray-400">Split With</p>
          <p class="mt-1 font-medium text-white">
            {{ splitWithNames()(details().splitBy) }}
          </p>
        </div>
        <div>
          <p class="text-gray-400">Total Amount</p>
          <p class="mt-1 font-medium text-white">€{{ details().totalAmount.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-gray-400">Settled</p>
          <p class="mt-1 font-medium text-white">
            {{ details().splitPaidPersonIds.length > 0 ? 'Yes' : 'No' }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class TransactionSplitDetailsComponent {
  readonly details = input.required<TransactionSplitDetails>();
  readonly personName = input.required<(id: 'me' | number | undefined) => string>();
  readonly splitWithNames = input.required<(ids: number[]) => string>();
  readonly splitTypeLabel = input.required<(type: 'split' | 'custom') => string>();
}
