import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EditAmountFieldComponent } from '../edit-form/edit-amount-field.component';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';
import { FIELD, FIELD_ERROR, FIELD_LABEL } from '../../utils/pill-styles';
import { friendlyDate } from '../../utils/period-pace';
import { dateFieldError } from '../../utils/date-order';

@Component({
  selector: 'app-adjustment-edit-fields',
  standalone: true,
  imports: [FormField, EditAmountFieldComponent, DateStepperComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label for="adj-edit-description" [class]="fieldLabel">{{ isTrip() ? 'Trip name' : 'Description' }}</label>
        <input
          id="adj-edit-description"
          type="text"
          [placeholder]="isTrip() ? 'Where to?' : 'e.g. Annual Bonus'"
          [formField]="descriptionField()"
          [class]="field"
        />
        @if (descriptionField()().touched() && descriptionField()().invalid()) {
          <span [class]="fieldError">
            {{ descriptionField()().errors()[0]?.message }}
          </span>
        }
      </div>

      <!-- A trip's total is the sum of its transactions, so it has no amount to edit. -->
      @if (!isTrip()) {
        <app-edit-amount-field
          inputId="adj-edit-amount"
          [amount]="amount()"
          [amountField]="amountField()"
          (amountChange)="amountChange.emit($event)"
        />
      }

      <div class="grid grid-cols-1 gap-3">
        <div class="space-y-1.5">
          <label for="adj-edit-start-date" [class]="fieldLabel">{{ isTrip() ? 'First day' : 'Start date' }}</label>
          <app-date-stepper size="sm">
            <div class="relative min-w-0 flex-1">
              <input
                #dateInput
                id="adj-edit-start-date"
                type="date"
                [formField]="startDateField()"
                [class]="field + ' scheme-dark text-transparent [-webkit-text-fill-color:transparent]'"
              />
              <span
                class="pointer-events-none absolute inset-0 flex items-center px-3.5 text-[15px] text-ink"
                aria-hidden="true"
                >{{ dateLabel(startDateField()().value()) }}</span
              >
            </div>
          </app-date-stepper>
          @if (startDateField()().touched() && startDateField()().invalid()) {
            <span [class]="fieldError">
              {{ startDateField()().errors()[0]?.message }}
            </span>
          }
        </div>

        <div class="space-y-1.5">
          <label for="adj-edit-end-date" [class]="fieldLabel">{{ isTrip() ? 'Last day' : 'End date' }}</label>
          <app-date-stepper size="sm">
            <div class="relative min-w-0 flex-1">
              <input
                #dateInput
                id="adj-edit-end-date"
                type="date"
                [formField]="endDateField()"
                [class]="field + ' scheme-dark text-transparent [-webkit-text-fill-color:transparent]'"
              />
              <span
                class="pointer-events-none absolute inset-0 flex items-center px-3.5 text-[15px] text-ink"
                aria-hidden="true"
                >{{ dateLabel(endDateField()().value()) }}</span
              >
            </div>
          </app-date-stepper>
          @if (endError(); as message) {
            <span role="alert" [class]="fieldError">{{ message }}</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdjustmentEditFieldsComponent {
  endError(): string | null {
    return dateFieldError(this.endDateField());
  }

  dateLabel(isoDate: string): string {
    return friendlyDate(isoDate) || 'Pick a date';
  }

  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly fieldError = FIELD_ERROR;

  readonly isTrip = input(false);
  readonly amount = input.required<number>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly startDateField = input.required<FieldTree<string>>();
  readonly endDateField = input.required<FieldTree<string>>();

  readonly amountChange = output<number>();
}
