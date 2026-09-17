import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldTree, FormField } from '@angular/forms/signals';
import { EditAmountFieldComponent } from '../edit-form/edit-amount-field.component';
import { TransactionFormModel } from './edit-transaction.model';

@Component({
  selector: 'app-transaction-edit-fields',
  standalone: true,
  imports: [CommonModule, FormField, EditAmountFieldComponent],
  template: `
    <div class="space-y-1.5">
      <label for="tx-edit-date" class="text-xs font-medium text-gray-400">Date</label>
      <input
        id="tx-edit-date"
        type="date"
        [formField]="dateField()"
        class="w-full min-w-0 appearance-none scheme-dark bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      />
      @if (dateField()().touched() && dateField()().invalid()) {
        <span class="text-[11px] text-red-400">{{ dateField()().errors()[0]?.message }}</span>
      }
    </div>

    <div class="space-y-1.5">
      <label for="tx-edit-description" class="text-xs font-medium text-gray-400"
        >Description</label
      >
      <input
        id="tx-edit-description"
        type="text"
        placeholder="e.g. Σκλαβενίτης"
        [formField]="descriptionField()"
        class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      />
      @if (descriptionField()().touched() && descriptionField()().invalid()) {
        <span class="text-[11px] text-red-400">{{ descriptionField()().errors()[0]?.message }}</span>
      }
    </div>

    <div class="space-y-1.5">
      <label for="tx-edit-category" class="text-xs font-medium text-gray-400">Category</label>
      <select
        id="tx-edit-category"
        [value]="model().category"
        (change)="categoryChange.emit($any($event.target).value)"
        class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      >
        <option value="">Select a category</option>
        @for (category of categories(); track category) {
          <option [value]="category" [selected]="model().category === category">
            {{ categoryLabel()(category) }}
          </option>
        }
      </select>
      @if (categoryField()().touched() && categoryField()().invalid()) {
        <span class="text-[11px] text-red-400">{{ categoryField()().errors()[0]?.message }}</span>
      }
    </div>

    @if (subcategories().length > 0) {
      <div class="space-y-1.5">
        <label for="tx-edit-subcategory" class="text-xs font-medium text-gray-400"
          >Subcategory</label
        >
        <select
          id="tx-edit-subcategory"
          [value]="model().subCategoryId ?? ''"
          (change)="onSubcategoryChange($event)"
          class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        >
          <option value="">Select a subcategory</option>
          @for (subcategory of subcategories(); track subcategory.id) {
            <option [value]="subcategory.id" [selected]="model().subCategoryId === subcategory.id">
              {{ subcategory.label }}
            </option>
          }
        </select>
        @if (subCategoryField()().touched() && subCategoryField()().invalid()) {
          <span class="text-[11px] text-red-400">{{ subCategoryField()().errors()[0]?.message }}</span>
        }
      </div>
    }

    <app-edit-amount-field
      inputId="tx-edit-amount"
      [amount]="model().amount"
      [amountField]="amountField()"
      (amountChange)="amountChange.emit($event)"
    />

    <div class="space-y-1.5">
      <label for="tx-edit-comment" class="text-xs font-medium text-gray-400">Comment</label>
      <textarea
        id="tx-edit-comment"
        rows="3"
        [formField]="commentField()"
        placeholder="Add a note about this transaction"
        class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none"
      ></textarea>
      @if (commentField()().touched() && commentField()().invalid()) {
        <span class="text-[11px] text-red-400">{{ commentField()().errors()[0]?.message }}</span>
      }
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

  readonly categoryChange = output<string>();
  readonly subcategoryChange = output<number | null>();
  readonly amountChange = output<number>();

  onSubcategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.subcategoryChange.emit(value === '' ? null : Number(value));
  }
}
