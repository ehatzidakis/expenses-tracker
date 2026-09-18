import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTree } from '@angular/forms/signals';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';

@Component({
  selector: 'app-edit-amount-field',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      <label [for]="inputId()" class="text-xs font-medium text-gray-400">Amount</label>
      <input
        [id]="inputId()"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        [value]="amount() === 0 ? '' : amount().toString()"
        placeholder="0.00"
        (input)="onInput($event)"
        class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        [class.blur-md]="privacyMode()"
        [class.select-none]="privacyMode()"
      />
      @if (amountField()().touched() && amountField()().invalid()) {
        <span class="text-[11px] text-red-400">
          {{ amountField()().errors()[0]?.message }}
        </span>
      }
    </div>
  `,
})
export class EditAmountFieldComponent {
  readonly inputId = input.required<string>();
  readonly amount = input.required<number>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly privacyMode = input(false);

  readonly amountChange = output<number>();

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    const parsed = parseDecimalInput(normalized);

    if (input.value.includes(',')) {
      input.value = normalized;
    }

    this.amountChange.emit(parsed);
  }
}
