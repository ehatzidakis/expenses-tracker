import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EditAmountFieldComponent } from '../edit-form/edit-amount-field.component';

@Component({
  selector: 'app-adjustment-edit-fields',
  standalone: true,
  imports: [FormField, EditAmountFieldComponent],
  template: `
    <div class="space-y-1.5">
      <label for="adj-edit-description" class="text-xs font-medium text-gray-400"
        >Description</label
      >
      <input
        id="adj-edit-description"
        type="text"
        placeholder="e.g. Annual Bonus"
        [formField]="descriptionField()"
        class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      />
      @if (descriptionField()().touched() && descriptionField()().invalid()) {
        <span class="text-[11px] text-red-400">
          {{ descriptionField()().errors()[0]?.message }}
        </span>
      }
    </div>

    <app-edit-amount-field
      inputId="adj-edit-amount"
      [amount]="amount()"
      [amountField]="amountField()"
      [privacyMode]="privacyMode()"
      (amountChange)="amountChange.emit($event)"
    />

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <label for="adj-edit-start-date" class="text-xs font-medium text-gray-400"
          >Start Date</label
        >
        <input
          id="adj-edit-start-date"
          type="date"
          [formField]="startDateField()"
          class="w-full min-w-0 appearance-none scheme-dark bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        />
        @if (startDateField()().touched() && startDateField()().invalid()) {
          <span class="text-[11px] text-red-400">
            {{ startDateField()().errors()[0]?.message }}
          </span>
        }
      </div>

      <div class="space-y-1.5">
        <label for="adj-edit-end-date" class="text-xs font-medium text-gray-400">End Date</label>
        <input
          id="adj-edit-end-date"
          type="date"
          [formField]="endDateField()"
          class="w-full min-w-0 appearance-none scheme-dark bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        />
        @if (endDateField()().touched() && endDateField()().invalid()) {
          <span class="text-[11px] text-red-400">
            {{ endDateField()().errors()[0]?.message }}
          </span>
        }
      </div>
    </div>
  `,
})
export class AdjustmentEditFieldsComponent {
  readonly amount = input.required<number>();
  readonly privacyMode = input.required<boolean>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly startDateField = input.required<FieldTree<string>>();
  readonly endDateField = input.required<FieldTree<string>>();

  readonly amountChange = output<number>();
}
