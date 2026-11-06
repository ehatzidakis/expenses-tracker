import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { friendlyDate } from '../../utils/period-pace';
import {
  FIELD,
  FIELD_ERROR,
  FIELD_LABEL,
  SEGMENT_BASE,
  SEGMENT_FRAME,
  SEGMENT_OFF,
  SEGMENT_ON,
} from '../../utils/pill-styles';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';

interface AdjustmentFieldsModel {
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  isTrip?: boolean;
  isSelectable?: boolean;
}

/**
 * New one-off or trip. A one-off leads with its amount like a transaction; a trip has no amount
 * of its own (its transactions add up), so it leads with its name and dates.
 */
@Component({
  selector: 'app-adjustment-fields',
  standalone: true,
  imports: [FormField, DateStepperComponent],
  host: { class: 'flex flex-col gap-5' },
  template: `
    @if (!model().isTrip) {
      <div>
        <label for="adj-amount" class="sr-only">Amount</label>
        <div
          class="flex items-baseline gap-1.5 border-b border-edge pb-2 transition-colors focus-within:border-ember"
        >
          <span class="type-wide text-[26px] font-bold text-ink-3" aria-hidden="true">€</span>
          <input
            id="adj-amount"
            size="1"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            [value]="model().amount === 0 ? '' : model().amount.toString()"
            placeholder="0.00"
            (input)="onAmountInput($event)"
            class="amount-display type-wide w-0 min-w-0 flex-1 bg-transparent text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-ink placeholder:text-ink-4 focus-visible:outline-none"
          />
        </div>
        @if (amountField()().touched() && amountField()().invalid()) {
          <p [class]="fieldError + ' mt-1.5'">{{ amountField()().errors()[0]?.message }}</p>
        }
      </div>
    }

    <div class="flex flex-col gap-1.5">
      <label for="adj-description" [class]="fieldLabel">{{ model().isTrip ? 'Trip name' : 'Title' }}</label>
      <input
        id="adj-description"
        type="text"
        [placeholder]="model().isTrip ? 'Where to?' : 'What was it?'"
        [formField]="descriptionField()"
        [class]="field"
      />
      @if (descriptionField()().touched() && descriptionField()().invalid()) {
        <p [class]="fieldError">{{ descriptionField()().errors()[0]?.message }}</p>
      }
    </div>

    @if (!model().isTrip) {
      <div role="group" aria-label="Type" [class]="segmentFrame + ' grid-cols-2'">
        <button
          type="button"
          [class]="segment(addition())"
          [attr.aria-pressed]="addition()"
          (click)="additionChange.emit(true)"
        >
          Income
        </button>
        <button
          type="button"
          [class]="segment(!addition())"
          [attr.aria-pressed]="!addition()"
          (click)="additionChange.emit(false)"
        >
          Expense
        </button>
      </div>
    }

    <div class="flex flex-col gap-1.5">
      <label for="adj-start-date" [class]="fieldLabel">{{ model().isTrip ? 'First day' : 'Start date' }}</label>
      <app-date-stepper>
        <div class="relative min-w-0 flex-1">
          <input
            #dateInput
            id="adj-start-date"
            type="date"
            [formField]="startDateField()"
            [class]="field + ' scheme-dark text-transparent [-webkit-text-fill-color:transparent]'"
          />
          <span
            class="pointer-events-none absolute inset-0 flex items-center px-3.5 text-[15px] text-ink"
            aria-hidden="true"
            >{{ dateLabel(model().startDate) }}</span
          >
        </div>
      </app-date-stepper>
      @if (startDateField()().touched() && startDateField()().invalid()) {
        <p [class]="fieldError">{{ startDateField()().errors()[0]?.message }}</p>
      }
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="adj-end-date" [class]="fieldLabel">{{ model().isTrip ? 'Last day' : 'End date' }}</label>
      <app-date-stepper>
        <div class="relative min-w-0 flex-1">
          <input
            #dateInput
            id="adj-end-date"
            type="date"
            [formField]="endDateField()"
            [class]="field + ' scheme-dark text-transparent [-webkit-text-fill-color:transparent]'"
          />
          <span
            class="pointer-events-none absolute inset-0 flex items-center px-3.5 text-[15px] text-ink"
            aria-hidden="true"
            >{{ dateLabel(model().endDate) }}</span
          >
        </div>
      </app-date-stepper>
      @if (endDateField()().touched() && endDateField()().invalid()) {
        <p [class]="fieldError">{{ endDateField()().errors()[0]?.message }}</p>
      }
    </div>

    @if (model().isTrip) {
      <div class="flex flex-col gap-1.5">
        <span id="adj-open-label" [class]="fieldLabel">New transactions</span>
        <div role="group" aria-labelledby="adj-open-label" [class]="segmentFrame + ' grid-cols-2'">
          <button
            type="button"
            [class]="segment(!!model().isSelectable)"
            [attr.aria-pressed]="!!model().isSelectable"
            (click)="selectableChange.emit(true)"
          >
            Open
          </button>
          <button
            type="button"
            [class]="segment(!model().isSelectable)"
            [attr.aria-pressed]="!model().isSelectable"
            (click)="selectableChange.emit(false)"
          >
            Closed
          </button>
        </div>
      </div>
    }
  `,
})
export class AdjustmentFieldsComponent {
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly fieldError = FIELD_ERROR;
  protected readonly segmentFrame = SEGMENT_FRAME;

  readonly model = input.required<AdjustmentFieldsModel>();
  readonly addition = input.required<boolean>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly startDateField = input.required<FieldTree<string>>();
  readonly endDateField = input.required<FieldTree<string>>();
  readonly selectableChange = output<boolean>();
  readonly additionChange = output<boolean>();
  readonly amountChange = output<number>();

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  dateLabel(isoDate: string): string {
    return friendlyDate(isoDate) || 'Pick a date';
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    if (input.value !== normalized && (input.value.includes(',') || input.value.includes('.')))
      input.value = normalized;
    this.amountChange.emit(parseDecimalInput(normalized));
  }
}
