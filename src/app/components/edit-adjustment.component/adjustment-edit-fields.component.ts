import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EditAmountFieldComponent } from '../edit-form/edit-amount-field.component';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';

@Component({
  selector: 'app-adjustment-edit-fields',
  standalone: true,
  imports: [FormField, EditAmountFieldComponent, DateStepperComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label for="adj-edit-description" class="text-xs font-medium text-ink-2"
          >Description</label
        >
        <input
          id="adj-edit-description"
          type="text"
          placeholder="e.g. Annual Bonus"
          [formField]="descriptionField()"
          class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ember/60"
        />
        @if (descriptionField()().touched() && descriptionField()().invalid()) {
          <span class="text-[11px] text-cherry">
            {{ descriptionField()().errors()[0]?.message }}
          </span>
        }
      </div>

      <app-edit-amount-field
        inputId="adj-edit-amount"
        [amount]="amount()"
        [amountField]="amountField()"
        (amountChange)="amountChange.emit($event)"
      />

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label for="adj-edit-start-date" class="text-xs font-medium text-ink-2"
            >Start Date</label
          >
          <app-date-stepper size="sm">
            <input
              #dateInput
              id="adj-edit-start-date"
              type="date"
              [formField]="startDateField()"
              class="flex-1 min-w-0 appearance-none scheme-dark bg-raised/60 border border-raised rounded-xl px-2 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ember/60"
            />
          </app-date-stepper>
          @if (startDateField()().touched() && startDateField()().invalid()) {
            <span class="text-[11px] text-cherry">
              {{ startDateField()().errors()[0]?.message }}
            </span>
          }
        </div>

        <div class="space-y-1.5">
          <label for="adj-edit-end-date" class="text-xs font-medium text-ink-2">End Date</label>
          <app-date-stepper size="sm">
            <input
              #dateInput
              id="adj-edit-end-date"
              type="date"
              [formField]="endDateField()"
              class="flex-1 min-w-0 appearance-none scheme-dark bg-raised/60 border border-raised rounded-xl px-2 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ember/60"
            />
          </app-date-stepper>
          @if (endDateField()().touched() && endDateField()().invalid()) {
            <span class="text-[11px] text-cherry">
              {{ endDateField()().errors()[0]?.message }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdjustmentEditFieldsComponent {
  readonly amount = input.required<number>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly startDateField = input.required<FieldTree<string>>();
  readonly endDateField = input.required<FieldTree<string>>();

  readonly amountChange = output<number>();
}
