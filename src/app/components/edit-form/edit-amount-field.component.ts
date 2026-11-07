import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTree } from '@angular/forms/signals';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { FIELD, FIELD_ERROR, FIELD_LABEL } from '../../utils/pill-styles';

@Component({
  selector: 'app-edit-amount-field',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      <label [for]="inputId()" [class]="fieldLabel">{{ label() }}</label>
      <div
        class="flex min-h-12 items-center gap-1 rounded-xl border border-edge bg-panel px-3.5 transition-colors focus-within:border-ember"
      >
      <span class="text-ink-3" aria-hidden="true">€</span>
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
        class="w-full min-w-0 bg-transparent text-ink tabular-nums placeholder:text-ink-4 focus-visible:outline-none"
        [class.text-ink-2]="readonly()"
        [class.cursor-not-allowed]="readonly()"
        appSensitive
      />
      </div>
      @if (amountField()().touched() && amountField()().invalid()) {
        <span [class]="fieldError">
          {{ amountField()().errors()[0]?.message }}
        </span>
      }
    </div>
  `,
})
export class EditAmountFieldComponent {
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly fieldError = FIELD_ERROR;

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
