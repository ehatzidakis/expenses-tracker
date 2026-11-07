import { Component, computed, input, output } from '@angular/core';
import { friendlyDate } from '../../utils/period-pace';
import { CommonModule } from '@angular/common';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EditAmountFieldComponent } from '../edit-form/edit-amount-field.component';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';
import { TransactionFormModel } from './edit-transaction.model';
import { FIELD, FIELD_ERROR, FIELD_LABEL } from '../../utils/pill-styles';

@Component({
  selector: 'app-transaction-edit-fields',
  standalone: true,
  imports: [CommonModule, FormField, EditAmountFieldComponent, DateStepperComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label for="tx-edit-date" [class]="fieldLabel">Date</label>
        <app-date-stepper>
          <div class="relative min-w-0 flex-1">
            <input
              #dateInput
              id="tx-edit-date"
              type="date"
              [formField]="dateField()"
              [class]="field + ' scheme-dark text-transparent [-webkit-text-fill-color:transparent]'"
            />
            <span
              class="pointer-events-none absolute inset-0 flex items-center px-3.5 text-[15px] text-ink"
              aria-hidden="true"
              >{{ dateLabel() }}</span
            >
          </div>
        </app-date-stepper>
        @if (dateField()().touched() && dateField()().invalid()) {
          <span [class]="fieldError">{{ dateField()().errors()[0]?.message }}</span>
        }
      </div>

      <div class="space-y-1.5">
        <label for="tx-edit-description" [class]="fieldLabel"
          >Description</label
        >
        <input
          id="tx-edit-description"
          type="text"
          placeholder="e.g. Σκλαβενίτης"
          [formField]="descriptionField()"
          [class]="field"
        />
        @if (descriptionField()().touched() && descriptionField()().invalid()) {
          <span [class]="fieldError">{{
            descriptionField()().errors()[0]?.message
          }}</span>
        }
      </div>

      <div class="space-y-1.5">
        <label for="tx-edit-category" [class]="fieldLabel">Category</label>
        <div class="relative">
          <select
            id="tx-edit-category"
            [value]="model().category"
            (change)="categoryChange.emit($any($event.target).value)"
            [class]="field + ' appearance-none pr-10'"
          >
            <option value="">Select a category</option>
            @for (category of categories(); track category) {
              <option [value]="category" [selected]="model().category === category">
                {{ readable(categoryLabel()(category)) }}
              </option>
            }
          </select>
          <svg
            class="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        </div>
        @if (categoryField()().touched() && categoryField()().invalid()) {
          <span [class]="fieldError">{{ categoryField()().errors()[0]?.message }}</span>
        }
      </div>

      @if (subcategories().length > 0) {
        <div class="space-y-1.5">
          <label for="tx-edit-subcategory" [class]="fieldLabel"
            >Subcategory</label
          >
          <div class="relative">
            <select
              id="tx-edit-subcategory"
              [value]="model().subCategoryId ?? ''"
              (change)="onSubcategoryChange($event)"
              [class]="field + ' appearance-none pr-10'"
            >
              <option value="">Select a subcategory</option>
              @for (subcategory of subcategories(); track subcategory.id) {
                <option
                  [value]="subcategory.id"
                  [selected]="model().subCategoryId === subcategory.id"
                >
                  {{ subcategory.label }}
                </option>
              }
            </select>
            <svg
              class="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
          @if (subCategoryField()().touched() && subCategoryField()().invalid()) {
            <span [class]="fieldError">{{
              subCategoryField()().errors()[0]?.message
            }}</span>
          }
        </div>
      }

      <app-edit-amount-field
        inputId="tx-edit-amount"
        [amount]="model().amount"
        [amountField]="amountField()"
        [label]="amountLabel()"
        [readonly]="amountReadonly()"
        (amountChange)="amountChange.emit($event)"
      />

      <div class="space-y-1.5">
        <label for="tx-edit-comment" [class]="fieldLabel">Comment</label>
        <textarea
          id="tx-edit-comment"
          rows="3"
          [formField]="commentField()"
          placeholder="Add a note about this transaction"
          [class]="field + ' resize-none py-3'"
        ></textarea>
        @if (commentField()().touched() && commentField()().invalid()) {
          <span [class]="fieldError">{{ commentField()().errors()[0]?.message }}</span>
        }
      </div>
    </div>
  `,
})
export class TransactionEditFieldsComponent {
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly fieldError = FIELD_ERROR;

  readonly model = input.required<TransactionFormModel>();
  readonly categories = input.required<string[]>();
  readonly subcategories = input.required<ReadonlyArray<{ id: number; label: string }>>();
  readonly dateField = input.required<FieldTree<string>>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly categoryField = input.required<FieldTree<string>>();
  readonly subCategoryField = input.required<FieldTree<number | null>>();
  readonly amountField = input.required<FieldTree<number>>();
  readonly commentField = input.required<FieldTree<string>>();
  readonly categoryLabel = input.required<(category: string) => string>();
  readonly amountLabel = input('Amount');
  readonly amountReadonly = input(false);

  readonly dateLabel = computed(() => friendlyDate(this.model().date) || 'Pick a date');

  readonly categoryChange = output<string>();
  readonly subcategoryChange = output<number | null>();
  readonly amountChange = output<number>();

  /** "🍽️ EatingOut" → "🍽️ Eating out", the way every other screen names categories. */
  readable(label: string): string {
    return label.replace(/([a-z])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`);
  }

  onSubcategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.subcategoryChange.emit(value === '' ? null : Number(value));
  }
}
