import { Component, computed, ElementRef, input, output, viewChild } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { getSubcategoryOptions } from '../../services/expense-state.service';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { friendlyDate } from '../../utils/period-pace';
import {
  ACTIVE_PILL,
  FIELD,
  FIELD_ERROR,
  FIELD_LABEL,
  IDLE_PILL,
  PILL_BASE,
} from '../../utils/pill-styles';
import { DateStepperComponent } from '../date-stepper/date-stepper.component';
import { CategoryPickerComponent, CategoryRoom } from '../category-picker/category-picker';

interface TransactionFieldsModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  amount: number;
}

/**
 * The till part of the Add tab: the amount as the headline, the category keyboard under it,
 * then description and date. Recurring picks are projected in between ([recurringRow]).
 */
@Component({
  selector: 'app-transaction-basic-fields',
  standalone: true,
  imports: [FormField, DateStepperComponent, CategoryPickerComponent],
  host: { class: 'flex flex-col gap-5' },
  template: `
    <div>
      <label for="tx-amount" class="sr-only">Amount</label>
      <div
        class="flex items-baseline gap-1.5 border-b border-edge pb-2 transition-colors focus-within:border-ember"
      >
        <span class="type-wide text-[26px] font-bold text-ink-3" aria-hidden="true">€</span>
        <input
          #amountInput
          id="tx-amount"
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
      <!-- Not blurred: the hint only appears after picking a recurring template, which is hidden in privacy mode -->
      @if (amountHint() != null && model().amount === 0) {
        <button
          type="button"
          (click)="amountHintUse.emit(amountHint()!)"
          class="inline-flex min-h-11 items-center text-[13px] text-ember-ink tabular-nums hover:text-ember-soft cursor-pointer"
        >
          Last month €{{ amountHint()!.toFixed(2) }} · tap to use
        </button>
      }
      @if (amountField()().touched() && amountField()().invalid()) {
        <p [class]="fieldError + ' mt-1.5'">{{ amountField()().errors()[0]?.message }}</p>
      }
    </div>

    <div class="flex flex-col gap-2">
      <app-category-picker
        [categories]="categories()"
        [selected]="model().category"
        [room]="room()"
        (pick)="categoryChange.emit($event)"
      />
      @if (categoryField()().touched() && categoryField()().invalid()) {
        <p [class]="fieldError">{{ categoryField()().errors()[0]?.message }}</p>
      }

      @if (subcategories().length > 0) {
        <div role="group" aria-label="Subcategory" class="flex flex-wrap gap-2 pt-1">
          @for (subcategory of subcategories(); track subcategory.id) {
            <button
              type="button"
              [class]="pillBase + ' flex items-center gap-1.5 ' + (model().subCategoryId === subcategory.id ? activePill : idlePill)"
              [attr.aria-pressed]="model().subCategoryId === subcategory.id"
              (click)="subcategoryChange.emit(subcategory.id)"
            >
              @if (splitLabel(subcategory.label); as part) {
                @if (part.glyph) {
                  <span class="text-[12px] opacity-60 grayscale-[40%]" aria-hidden="true">{{ part.glyph }}</span>
                }
                {{ part.text }}
              }
            </button>
          }
        </div>
        @if (subCategoryField()().touched() && subCategoryField()().invalid()) {
          <p [class]="fieldError">{{ subCategoryField()().errors()[0]?.message }}</p>
        }
      }
    </div>

    <ng-content select="[recurringRow]" />

    <div class="flex flex-col gap-1.5">
      <label for="tx-description" [class]="fieldLabel">Description</label>
      <input
        #descriptionInput
        id="tx-description"
        type="text"
        placeholder="What was it?"
        [formField]="descriptionField()"
        [class]="field"
      />
      @if (descriptionField()().touched() && descriptionField()().invalid()) {
        <p [class]="fieldError">{{ descriptionField()().errors()[0]?.message }}</p>
      }
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="tx-date" [class]="fieldLabel">Date</label>
      <app-date-stepper>
        <div class="relative min-w-0 flex-1">
          <input
            #dateInput
            id="tx-date"
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
        <p [class]="fieldError">{{ dateField()().errors()[0]?.message }}</p>
      }
    </div>
  `,
})
export class TransactionBasicFieldsComponent {
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly fieldError = FIELD_ERROR;
  protected readonly pillBase = PILL_BASE;
  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;

  readonly model = input.required<TransactionFieldsModel>();
  readonly categories = input.required<ReadonlyArray<string>>();
  /** What is left per category in the month of the entered date; null hides it (kiosk, trips). */
  readonly room = input<Record<string, CategoryRoom> | null>(null);
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

  readonly categoryChange = output<string>();
  readonly subcategoryChange = output<number | null>();
  readonly amountChange = output<number>();
  readonly amountHintUse = output<number>();

  readonly subcategories = computed(() => getSubcategoryOptions(this.model().category));
  readonly dateLabel = computed(() => friendlyDate(this.model().date) || 'Pick a date');

  /** "🔥 Electricity" → a muted glyph and the words, like the category tiles. */
  splitLabel(label: string): { glyph: string; text: string } {
    const match =
      /^(\p{Extended_Pictographic}[\p{Extended_Pictographic}\p{Emoji_Modifier}️‍]*)\s*(.*)$/u.exec(
        label,
      );
    return match ? { glyph: match[1], text: match[2] } : { glyph: '', text: label };
  }

  focusField(field: 'description' | 'amount'): void {
    const target = field === 'description' ? this.descriptionInput() : this.amountInput();
    target.nativeElement.focus({ preventScroll: true });
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
