import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';

interface AdjustmentFieldsModel {
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  isTrip?: boolean;
  isSelectable?: boolean;
}

@Component({
  selector: 'app-adjustment-fields',
  standalone: true,
  imports: [CommonModule, FormField],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-gray-400">Trip</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
        <button
          type="button"
          (click)="tripChange.emit(true)"
          class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          [class.bg-sky-500/20]="model().isTrip"
          [class.text-sky-400]="model().isTrip"
          [class.border]="model().isTrip"
          [class.border-sky-500/30]="model().isTrip"
          [class.text-gray-400]="!model().isTrip"
        >
          🛫 Yes
        </button>
        <button
          type="button"
          (click)="tripChange.emit(false)"
          class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          [class.bg-gray-700/60]="!model().isTrip"
          [class.text-gray-200]="!model().isTrip"
          [class.border]="!model().isTrip"
          [class.border-gray-600/40]="!model().isTrip"
          [class.text-gray-400]="model().isTrip"
        >
          No
        </button>
        </div>
      </div>

    @if (model().isTrip) {
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-gray-400">Accept New Transactions</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
          <button
            type="button"
            (click)="selectableChange.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-emerald-500/20]="model().isSelectable"
            [class.text-emerald-400]="model().isSelectable"
            [class.border]="model().isSelectable"
            [class.border-emerald-500/30]="model().isSelectable"
            [class.text-gray-400]="!model().isSelectable"
          >
            🔓 Open
          </button>
          <button
            type="button"
            (click)="selectableChange.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-gray-700/60]="!model().isSelectable"
            [class.text-gray-200]="!model().isSelectable"
            [class.border]="!model().isSelectable"
            [class.border-gray-600/40]="!model().isSelectable"
            [class.text-gray-400]="model().isSelectable"
          >
            🔒 Closed
          </button>
        </div>
      </div>
    }

    <div class="space-y-1.5">
      <label for="adj-description" class="text-xs font-medium text-gray-400">Description</label>
      <input
        id="adj-description"
        type="text"
        placeholder="Placeholder"
        [formField]="descriptionField()"
        class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      />
      @if (descriptionField()().touched() && descriptionField()().invalid()) {
        <span class="text-[11px] text-red-400">{{
          descriptionField()().errors()[0]?.message
        }}</span>
      }
    </div>

    @if (!model().isTrip) {
      <div class="space-y-1.5">
        <label for="adj-amount" class="text-xs font-medium text-gray-400">Amount</label>
        <input
          id="adj-amount"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          [value]="model().amount === 0 ? '' : model().amount.toString()"
          placeholder="0.00"
          (input)="onAmountInput($event)"
          class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 tabular-nums"
        />
        @if (amountField()().touched() && amountField()().invalid()) {
          <span class="text-[11px] text-red-400">{{ amountField()().errors()[0]?.message }}</span>
        }
      </div>
    }

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <label for="adj-start-date" class="text-xs font-medium text-gray-400">Start Date</label
        ><input
          id="adj-start-date"
          type="date"
          [formField]="startDateField()"
          class="w-full min-w-0 appearance-none scheme-dark bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        />
        @if (startDateField()().touched() && startDateField()().invalid()) {
          <span class="text-[11px] text-red-400">{{
            startDateField()().errors()[0]?.message
          }}</span>
        }
      </div>
      <div class="space-y-1.5">
        <label for="adj-end-date" class="text-xs font-medium text-gray-400">End Date</label
        ><input
          id="adj-end-date"
          type="date"
          [formField]="endDateField()"
          class="w-full min-w-0 appearance-none scheme-dark bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        />
        @if (endDateField()().touched() && endDateField()().invalid()) {
          <span class="text-[11px] text-red-400">{{ endDateField()().errors()[0]?.message }}</span>
        }
      </div>
    </div>

    <div class="space-y-1.5">
      <label class="text-xs font-medium text-gray-400">Adjustment Type</label>
      <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
        <button
          type="button"
          (click)="additionChange.emit(true)"
          class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          [class.bg-emerald-500/20]="addition()"
          [class.text-emerald-400]="addition()"
          [class.border]="addition()"
          [class.border-emerald-500/30]="addition()"
          [class.text-gray-400]="!addition()"
        >
          <span>+</span> Addition
        </button>
        <button
          type="button"
          (click)="additionChange.emit(false)"
          class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          [class.bg-red-500/20]="!addition()"
          [class.text-red-400]="!addition()"
          [class.border]="!addition()"
          [class.border-red-500/30]="!addition()"
          [class.text-gray-400]="addition()"
        >
          <span>-</span> Subtraction
        </button>
      </div>
    </div>
    </div>
  `,
})
export class AdjustmentFieldsComponent {
  readonly model = input.required<AdjustmentFieldsModel>();
  readonly addition = input.required<boolean>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly startDateField = input.required<FieldTree<string>>();
  readonly endDateField = input.required<FieldTree<string>>();
  readonly tripChange = output<boolean>();
  readonly selectableChange = output<boolean>();
  readonly additionChange = output<boolean>();
  readonly amountChange = output<number>();

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    if (input.value !== normalized && (input.value.includes(',') || input.value.includes('.')))
      input.value = normalized;
    this.amountChange.emit(parseDecimalInput(normalized));
  }
}
