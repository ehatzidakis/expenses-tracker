import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, input, output, viewChild } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { getCategoryMeta, getSubcategoryOptions } from '../../services/expense-state.service';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';

interface TransactionFieldsModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  amount: number;
}

@Component({
  selector: 'app-transaction-basic-fields',
  standalone: true,
  imports: [CommonModule, FormField, DateStepperComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-gray-400">Link with Trip</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
          <button
            type="button"
            (click)="linkChange.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-sky-500/20]="linked()"
            [class.text-sky-400]="linked()"
            [class.border]="linked()"
            [class.border-sky-500/30]="linked()"
            [class.text-gray-400]="!linked()"
          >
            🛫 Yes
          </button>
          <button
            type="button"
            (click)="linkChange.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-gray-700/60]="!linked()"
            [class.text-gray-200]="!linked()"
            [class.border]="!linked()"
            [class.border-gray-600/40]="!linked()"
            [class.text-gray-400]="linked()"
          >
            No
          </button>
        </div>
      </div>

      @if (linked()) {
        <div class="space-y-1.5">
          <label for="tx-trip" class="text-xs font-medium text-gray-400">Select Trip</label>
          @if (trips().length === 0) {
            <p class="text-xs text-gray-500 py-1">No open trips available.</p>
          } @else {
            <select
              id="tx-trip"
              [value]="selectedTripId()"
              (change)="tripChange.emit($any($event.target).value)"
              class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            >
              <option value="">Select a trip</option>
              @for (trip of trips(); track trip.id) {
                <option [value]="trip.id">{{ trip.title }}</option>
              }
            </select>
          }
        </div>
      }

      <div class="space-y-1.5">
        <label for="tx-date" class="text-xs font-medium text-gray-400">Date</label>
        <app-date-stepper>
          <input
            #dateInput
            id="tx-date"
            type="date"
            [formField]="dateField()"
            class="flex-1 min-w-0 appearance-none scheme-dark bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </app-date-stepper>
        @if (dateField()().touched() && dateField()().invalid()) {
          <span class="text-[11px] text-red-400">{{ dateField()().errors()[0]?.message }}</span>
        }
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <label for="tx-description" class="text-xs font-medium text-gray-400">Description</label>
          <ng-content select="[descriptionAction]" />
        </div>
        <ng-content select="[descriptionExtras]" />
        <input
          #descriptionInput
          id="tx-description"
          type="text"
          placeholder="Add transaction description"
          [formField]="descriptionField()"
          class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        />
        @if (descriptionField()().touched() && descriptionField()().invalid()) {
          <span class="text-[11px] text-red-400">{{
            descriptionField()().errors()[0]?.message
          }}</span>
        }
      </div>

      <div class="space-y-1.5">
        <label for="tx-category" class="text-xs font-medium text-gray-400">Category</label>
        <select
          id="tx-category"
          [value]="model().category"
          (change)="categoryChange.emit($any($event.target).value)"
          class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        >
          <option value="">Select a category</option>
          @for (category of categories(); track category) {
            <option [value]="category">{{ categoryLabel(category) }}</option>
          }
        </select>
        @if (categoryField()().touched() && categoryField()().invalid()) {
          <span class="text-[11px] text-red-400">{{ categoryField()().errors()[0]?.message }}</span>
        }
      </div>

      @if (subcategories().length > 0) {
        <div class="space-y-1.5">
          <label for="tx-subcategory" class="text-xs font-medium text-gray-400">Subcategory</label>
          <select
            id="tx-subcategory"
            [value]="model().subCategoryId ?? ''"
            (change)="
              subcategoryChange.emit(
                $any($event.target).value === '' ? null : +$any($event.target).value
              )
            "
            class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          >
            <option value="" [selected]="model().subCategoryId == null">
              Select a subcategory
            </option>
            <!-- [selected] per option: the select's own [value] runs before new options exist -->
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
            <span class="text-[11px] text-red-400">{{
              subCategoryField()().errors()[0]?.message
            }}</span>
          }
        </div>
      }

      <div class="space-y-1.5">
        <label for="tx-amount" class="text-xs font-medium text-gray-400">Amount</label>
        <input
          #amountInput
          id="tx-amount"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          [value]="model().amount === 0 ? '' : model().amount.toString()"
          placeholder="0.00"
          (input)="onAmountInput($event)"
          class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 tabular-nums"
        />
        @if (amountHint() != null && model().amount === 0) {
          <button
            type="button"
            (click)="amountHintUse.emit(amountHint()!)"
            class="text-[11px] text-indigo-300 hover:text-indigo-200 cursor-pointer tabular-nums"
          >
            Last month: €{{ amountHint()!.toFixed(2) }} · tap to use
          </button>
        }
        @if (amountField()().touched() && amountField()().invalid()) {
          <span class="text-[11px] text-red-400">{{ amountField()().errors()[0]?.message }}</span>
        }
      </div>
    </div>
  `,
})
export class TransactionBasicFieldsComponent {
  readonly model = input.required<TransactionFieldsModel>();
  readonly categories = input.required<ReadonlyArray<string>>();
  readonly linked = input.required<boolean>();
  readonly trips = input.required<ReadonlyArray<{ id: string; title: string }>>();
  readonly selectedTripId = input.required<string>();
  readonly dateField = input.required<FieldTree<string>>();
  readonly descriptionField = input.required<FieldTree<string>>();
  readonly categoryField = input.required<FieldTree<string>>();
  readonly subCategoryField = input.required<FieldTree<number | null>>();
  readonly amountField = input.required<FieldTree<number>>();
  /** Last month's amount for the picked template, shown as a tappable hint. */
  readonly amountHint = input<number | null>(null);

  private readonly descriptionInput =
    viewChild.required<ElementRef<HTMLInputElement>>('descriptionInput');
  private readonly amountInput = viewChild.required<ElementRef<HTMLInputElement>>('amountInput');

  readonly linkChange = output<boolean>();
  readonly tripChange = output<string>();
  readonly categoryChange = output<string>();
  readonly subcategoryChange = output<number | null>();
  readonly amountChange = output<number>();
  readonly amountHintUse = output<number>();

  readonly subcategories = computed(() => getSubcategoryOptions(this.model().category));

  focusField(field: 'description' | 'amount'): void {
    const target = field === 'description' ? this.descriptionInput() : this.amountInput();
    target.nativeElement.focus({ preventScroll: true });
  }

  categoryLabel(category: string): string {
    return `${getCategoryMeta(category).emoji} ${category}`;
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    if (input.value !== normalized && (input.value.includes(',') || input.value.includes('.'))) {
      input.value = normalized;
    }
    this.amountChange.emit(parseDecimalInput(normalized));
  }
}
