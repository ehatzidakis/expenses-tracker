import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EditAmountFieldComponent } from '../edit-form/edit-amount-field.component';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';
import { TransactionFormModel } from './edit-transaction.model';

@Component({
  selector: 'app-transaction-edit-fields',
  standalone: true,
  imports: [CommonModule, FormField, EditAmountFieldComponent, DateStepperComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label for="tx-edit-date" class="text-xs font-medium text-ink-2">Date</label>
        <app-date-stepper>
          <input
            #dateInput
            id="tx-edit-date"
            type="date"
            [formField]="dateField()"
            class="flex-1 min-w-0 appearance-none scheme-dark bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ember/60"
          />
        </app-date-stepper>
        @if (dateField()().touched() && dateField()().invalid()) {
          <span class="text-[11px] text-cherry">{{ dateField()().errors()[0]?.message }}</span>
        }
      </div>

      <div class="space-y-1.5">
        <label for="tx-edit-description" class="text-xs font-medium text-ink-2"
          >Description</label
        >
        <input
          id="tx-edit-description"
          type="text"
          placeholder="e.g. Σκλαβενίτης"
          [formField]="descriptionField()"
          class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ember/60"
        />
        @if (descriptionField()().touched() && descriptionField()().invalid()) {
          <span class="text-[11px] text-cherry">{{
            descriptionField()().errors()[0]?.message
          }}</span>
        }
      </div>

      <div class="space-y-1.5">
        <label for="tx-edit-category" class="text-xs font-medium text-ink-2">Category</label>
        <select
          id="tx-edit-category"
          [value]="model().category"
          (change)="categoryChange.emit($any($event.target).value)"
          class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ember/60"
        >
          <option value="">Select a category</option>
          @for (category of categories(); track category) {
            <option [value]="category" [selected]="model().category === category">
              {{ categoryLabel()(category) }}
            </option>
          }
        </select>
        @if (categoryField()().touched() && categoryField()().invalid()) {
          <span class="text-[11px] text-cherry">{{ categoryField()().errors()[0]?.message }}</span>
        }
      </div>

      @if (subcategories().length > 0) {
        <div class="space-y-1.5">
          <label for="tx-edit-subcategory" class="text-xs font-medium text-ink-2"
            >Subcategory</label
          >
          <select
            id="tx-edit-subcategory"
            [value]="model().subCategoryId ?? ''"
            (change)="onSubcategoryChange($event)"
            class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ember/60"
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
          @if (subCategoryField()().touched() && subCategoryField()().invalid()) {
            <span class="text-[11px] text-cherry">{{
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
        <label for="tx-edit-comment" class="text-xs font-medium text-ink-2">Comment</label>
        <textarea
          id="tx-edit-comment"
          rows="3"
          [formField]="commentField()"
          placeholder="Add a note about this transaction"
          class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ember/60 resize-none"
        ></textarea>
        @if (commentField()().touched() && commentField()().invalid()) {
          <span class="text-[11px] text-cherry">{{ commentField()().errors()[0]?.message }}</span>
        }
      </div>
    </div>
  `,
})
export class TransactionEditFieldsComponent {
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

  readonly categoryChange = output<string>();
  readonly subcategoryChange = output<number | null>();
  readonly amountChange = output<number>();

  onSubcategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.subcategoryChange.emit(value === '' ? null : Number(value));
  }
}
