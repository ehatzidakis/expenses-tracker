import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTree } from '@angular/forms/signals';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { SensitiveDirective } from '../../utils/sensitive.directive';

@Component({
  selector: 'app-edit-amount-field',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      <label [for]="inputId()" class="text-xs font-medium text-ink-2">{{ label() }}</label>
      <input
        [id]="inputId()"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        [readOnly]="readonly()"
        [attr.aria-readonly]="readonly()"
        [value]="amount() === 0 ? '' : amount().toString()"
        placeholder="0.00"
        (input)="onInput($event)"
        class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ember/60"
        [class.text-ink-2]="readonly()"
        [class.cursor-not-allowed]="readonly()"
        appSensitive
      />
      @if (amountField()().touched() && amountField()().invalid()) {
        <span class="text-[11px] text-cherry">
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
  readonly label = input('Amount');
  readonly readonly = input(false);

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
