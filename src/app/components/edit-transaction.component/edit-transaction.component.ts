import { Component, inject, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import { CATEGORY_NAMES, getCategoryMeta } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { PEOPLE } from '../../models/splitz.model';
import { PrivacyService } from '../../services/privacy.service';
import { ConfirmModal } from '../confirm-modal/confirm-modal';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';

interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  amount: number;
  isSplit?: boolean;
  paidBy?: 'me' | number;
  splitBy?: number[];
  splitPaidPersonIds?: number[];
  splitType?: 'split' | 'onlyMeOwes' | 'onlyTheyOwe';
  totalAmount?: number;
}

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [CommonModule, FormField, ConfirmModal],
  host: { class: 'block' },
  templateUrl: './edit-transaction.component.html',
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

  constructor() {
    // Populate form model when input transaction signal resolves
    effect(() => {
      const tx = this.transaction();
      if (tx) {
        this.model.set({
          date: tx.date,
          description: tx.description,
          category: tx.category,
          amount: tx.amount,
          isSplit: tx.isSplit,
          paidBy: tx.paidBy,
          splitBy: tx.splitBy,
          splitPaidPersonIds: tx.splitPaidPersonIds,
          splitType: tx.splitType,
          totalAmount: tx.totalAmount,
        });
      }
    });
  }

  readonly transactionForm = form(this.model, (schemaPath) => {
    required(schemaPath.date, { message: 'Date is required' });
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    required(schemaPath.category, { message: 'Category is required' });
  });

  getCategoryOptionLabel(category: string): string {
    return `${getCategoryMeta(category).emoji} ${category}`;
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

  getSplitTypeLabel(type?: 'split' | 'onlyMeOwes' | 'onlyTheyOwe'): string {
    switch (type) {
      case 'onlyMeOwes':
        return 'Borrowed 💸';
      case 'onlyTheyOwe':
        return 'Lent 💸';
      case 'split':
      default:
        return 'Splitz';
    }
  }

  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    const parsed = parseDecimalInput(normalized);

    if (input.value.includes(',')) {
      input.value = normalized;
    }

    this.model.update((value) => ({ ...value, amount: parsed }));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }

    const value = this.model();
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
