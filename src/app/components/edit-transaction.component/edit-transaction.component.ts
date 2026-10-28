import { Component, inject, input, output, signal, effect, computed } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { NewTransactionInput, TransactionService } from '../../services/transaction-service';
import {
  CATEGORY_NAMES,
  categoryRequiresSubcategory,
  getCategoryMeta,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { PEOPLE } from '../../models/splitz.model';
import { PrivacyService } from '../../services/privacy.service';
import {
  TransactionFormModel,
  buildTransactionFormModel,
  isSplitLocked,
} from './edit-transaction.model';
import { EditFormShellComponent } from '../edit-form/edit-form-shell.component';
import { TransactionEditFieldsComponent } from './transaction-edit-fields.component';
import { TransactionSplitSummaryComponent } from './transaction-split-summary.component';
import {
  CreateSplitState,
  SplitFieldsComponent,
  toSplitState,
} from '../create-transaction.component/split-fields.component';
import {
  BuildResult,
  buildTransactionUpdatePayload,
} from '../create-transaction.component/transaction-payload';

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [
    EditFormShellComponent,
    TransactionEditFieldsComponent,
    TransactionSplitSummaryComponent,
    SplitFieldsComponent,
  ],
  host: { class: 'block' },
  template: `
    <app-edit-form-shell
      title="Edit Transaction"
      [formInvalid]="transactionForm().invalid()"
      [submitting]="submitting()"
      [deleting]="deleting()"
      [privacyDisabled]="privacyService.isPrivacyMode()"
      [errorMessage]="errorMessage()"
      deleteLabel="Delete Transaction"
      deleteTitle="Delete Transaction?"
      deleteMessage="Are you sure you want to delete this transaction?"
      [showDeleteConfirm]="showDeleteConfirm()"
      (back)="back.emit()"
      (submitted)="onSubmit($event)"
      (deleteRequested)="requestDelete()"
      (deleteConfirmed)="onDelete()"
      (deleteCancelled)="showDeleteConfirm.set(false)"
    >
      <app-transaction-edit-fields
        [model]="model()"
        [categories]="categories()"
        [subcategories]="availableSubcategories()"
        [dateField]="transactionForm.date"
        [descriptionField]="transactionForm.description"
        [categoryField]="transactionForm.category"
        [subCategoryField]="transactionForm.subCategoryId"
        [amountField]="transactionForm.amount"
        [commentField]="transactionForm.comment"
        [categoryLabel]="getCategoryOptionLabel"
        [amountLabel]="split().goesSplitzes ? 'Total bill' : 'Amount'"
        [amountReadonly]="locked()"
        [privacyMode]="privacyService.isPrivacyMode()"
        (categoryChange)="setCategory($event)"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="onAmountChange($event)"
      />

      @if (locked()) {
        <app-transaction-split-summary [transaction]="transaction()" />
      } @else {
        <app-split-fields
          [amount]="model().amount"
          [people]="people"
          [state]="split()"
          [allowCustom]="true"
          (stateChange)="split.set($event)"
          (reset)="resetSplit()"
        />
      }
    </app-edit-form-shell>
  `,
})
export class EditTransactionComponent {
  readonly showDeleteConfirm = signal(false);
  private transactionService = inject(TransactionService);
  readonly privacyService = inject(PrivacyService);
  private queryClient = inject(QueryClient);

  readonly transaction = input.required<Transaction>();
  readonly categoryOverride = input<string[] | null>(null);

  readonly back = output<void>();
  readonly updated = output<void>();
  readonly deleted = output<void>();

  readonly people = PEOPLE;
  readonly categories = computed(() => this.categoryOverride() ?? CATEGORY_NAMES);

  readonly model = signal<TransactionFormModel>({
    date: '',
    description: '',
    category: '',
    subCategoryId: null,
    subCategory: '',
    comment: '',
    amount: 0,
  });

  readonly split = signal<CreateSplitState>(toSplitState({}));
  readonly locked = computed(() => isSplitLocked(this.transaction()));

  constructor() {
    // Populate form model when input transaction signal resolves
    effect(() => {
      const tx = this.transaction();
      if (tx) {
        this.model.set(buildTransactionFormModel(tx));
        this.split.set(toSplitState(tx));
        this.errorMessage.set(null);
      }
    });
  }

  readonly transactionForm = form(this.model, (schemaPath) => {
    required(schemaPath.date, { message: 'Date is required' });
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    maxLength(schemaPath.comment, 250, {
      message: 'Comment must be 250 characters or fewer',
    });
    required(schemaPath.category, { message: 'Category is required' });
  });

  readonly availableSubcategories = computed(() => getSubcategoryOptions(this.model().category));

  getCategoryOptionLabel(category: string): string {
    return `${getCategoryMeta(category).emoji} ${category}`;
  }

  setCategory(category: string): void {
    // Match against the list the dropdown shows (trip categories for trip transactions).
    const shown = this.categories();
    const normalizedCategory =
      shown.find((name) => name.toLowerCase() === category.trim().toLowerCase()) ?? '';

    const options = getSubcategoryOptions(normalizedCategory);
    const currentSelection = this.model().subCategoryId;
    const nextSelection =
      currentSelection != null && options.some((option) => option.id === currentSelection)
        ? currentSelection
        : options.length > 0
          ? options[0].id
          : null;

    this.model.update((value) => ({
      ...value,
      category: normalizedCategory,
      subCategoryId: nextSelection,
      subCategory: options.find((option) => option.id === nextSelection)?.name ?? '',
    }));
  }

  setSubcategory(subCategoryId: number | null): void {
    const option = this.availableSubcategories().find((item) => item.id === subCategoryId) ?? null;
    this.model.update((value) => ({
      ...value,
      subCategoryId: option?.id ?? null,
      subCategory: option?.name ?? '',
    }));
  }

  readonly submitting = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  onAmountChange(amount: number): void {
    if (this.locked()) return;
    this.model.update((value) => ({ ...value, amount }));
    this.errorMessage.set(null);
  }

  resetSplit(): void {
    this.split.set(toSplitState({}));
  }

  /**
   * Locked splits keep their money untouched (no split keys → the service leaves them alone).
   * Otherwise the form works like Create: amount is the full bill and my share is derived.
   */
  private buildPayload(): BuildResult<NewTransactionInput> {
    const value = this.model();
    const tx = this.transaction();

    if (!this.locked()) {
      return buildTransactionUpdatePayload(value, this.split(), tx.adjustmentId);
    }

    if (categoryRequiresSubcategory(value.category) && !value.subCategoryId) {
      return { ok: false, error: 'Please select a valid subcategory for this transaction.' };
    }
    return {
      ok: true,
      payload: {
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        subCategoryId: value.subCategoryId ?? undefined,
        subCategory: value.subCategory,
        comment: value.comment.trim() || undefined,
        amount: tx.amount,
      },
    };
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }

    if (this.model().amount <= 0) {
      this.errorMessage.set('Amount must be greater than 0');
      return;
    }

    const result = this.buildPayload();
    if (!result.ok) {
      this.errorMessage.set(result.error);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.transactionService.updateTransaction(this.transaction(), result.payload);

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
      this.updated.emit();
    } catch (err) {
      console.error('Update transaction error:', err);
      this.errorMessage.set('Unable to update transaction. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onDelete(): Promise<void> {
    if (this.deleting()) return;

    this.showDeleteConfirm.set(false);

    this.deleting.set(true);
    this.errorMessage.set(null);

    try {
      await this.transactionService.deleteTransaction(this.transaction());
      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
      this.deleted.emit();
    } catch (err) {
      console.error('Delete transaction error:', err);
      this.errorMessage.set('Unable to delete transaction. Please try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
