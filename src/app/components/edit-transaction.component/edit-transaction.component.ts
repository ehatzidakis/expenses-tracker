import { Component, inject, input, output, signal, effect, computed } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import {
  CATEGORY_NAMES,
  categoryRequiresSubcategory,
  getCategoryMeta,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { PEOPLE } from '../../models/splitz.model';
import { PrivacyService } from '../../services/privacy.service';
import { TransactionFormModel, buildTransactionFormModel } from './edit-transaction.model';
import { EditFormShellComponent } from '../edit-form/edit-form-shell.component';
import { TransactionEditFieldsComponent } from './transaction-edit-fields.component';
import { TransactionSplitDetailsComponent } from './transaction-split-details.component';

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [
    EditFormShellComponent,
    TransactionEditFieldsComponent,
    TransactionSplitDetailsComponent,
  ],
  host: { class: 'block' },
  template: `
    <app-edit-form-shell
      title="Edit Transaction"
      outerClass="space-y-4 border border-gray-800/80 rounded-2xl p-4 bg-gray-900/60 backdrop-blur-sm"
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
        (categoryChange)="setCategory($event)"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="onAmountChange($event)"
      />

      @if (splitMeta(); as split) {
        <app-transaction-split-details
          [details]="split"
          [personName]="personNameForChild"
          [splitWithNames]="splitWithNamesForChild"
          [splitTypeLabel]="splitTypeLabelForChild"
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

  // readonly categories = CATEGORY_NAMES;
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

  readonly splitMeta = computed(() => {
    const tx = this.transaction();
    if (!tx?.isSplit) {
      return null;
    }

    return {
      isSplit: tx.isSplit,
      paidBy: tx.paidBy,
      splitBy: tx.splitBy ?? [],
      splitType: tx.splitType ?? 'split',
      totalAmount: tx.totalAmount ?? tx.amount,
      splitPaidPersonIds: tx.splitPaidPersonIds ?? [],
    };
  });

  readonly personNameForChild = (id: 'me' | number | undefined): string => this.getPersonName(id);
  readonly splitWithNamesForChild = (ids: number[]): string => this.getSplitWithNames(ids);
  readonly splitTypeLabelForChild = (type: 'split' | 'custom'): string =>
    this.getSplitTypeLabel(type);

  private hydrateModelFromTransaction(tx: Transaction): void {
    this.model.set(buildTransactionFormModel(tx));
  }

  constructor() {
    // Populate form model when input transaction signal resolves
    effect(() => {
      const tx = this.transaction();
      if (tx) {
        this.hydrateModelFromTransaction(tx);
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
    const normalizedCategory =
      CATEGORY_NAMES.find((name) => name.toLowerCase() === category.trim().toLowerCase()) ??
      CATEGORY_NAMES[0] ??
      '';

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

  getPersonName(id: 'me' | number | undefined): string {
    if (id === 'me' || id === undefined) {
      return id === 'me' ? 'me' : 'Unknown';
    }

    const person = PEOPLE.find((entry) => entry.id === id);
    return person?.name ?? `Person ${id}`;
  }

  getSplitWithNames(ids: number[] = []): string {
    if (!ids.length) {
      return 'None';
    }

    return ids.map((id) => this.getPersonName(id)).join(', ');
  }

  getSplitTypeLabel(type?: 'split' | 'custom'): string {
    switch (type) {
      case 'custom':
        return 'Custom split';
      case 'split':
      default:
        return 'Splitz';
    }
  }

  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  onAmountChange(amount: number): void {
    this.model.update((value) => ({ ...value, amount }));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }

    const value = this.model();
    if (categoryRequiresSubcategory(value.category) && !value.subCategoryId) {
      this.errorMessage.set('Please select a valid subcategory for this transaction.');
      return;
    }
    if (value.amount <= 0) {
      this.errorMessage.set('Amount must be greater than 0');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.transactionService.updateTransaction(this.transaction(), {
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        subCategoryId: value.subCategoryId ?? undefined,
        subCategory: value.subCategory,
        comment: value.comment.trim() || undefined,
        amount: value.amount,
      });

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
