import { Component, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import { CATEGORY_NAMES } from '../../services/expense-state.service';
import { Transaction } from '../../models/transaction.model';
import { PrivacyService } from '../../services/privacy.service';

interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  amount: number;
}

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [CommonModule, FormField],
  host: { class: 'block' },
  templateUrl: './edit-transaction.component.html',
})
export class EditTransactionComponent {
  private transactionService = inject(TransactionService);
  readonly privacyService = inject(PrivacyService);
  private queryClient = inject(QueryClient);

  readonly transaction = input.required<Transaction>();

  readonly back = output<void>();
  readonly updated = output<void>();
  readonly deleted = output<void>();

  readonly categories = CATEGORY_NAMES;

  readonly model = signal<TransactionFormModel>({
    date: '',
    description: '',
    category: '',
    amount: 0,
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
    min(schemaPath.amount, 0.01, { message: 'Amount must be greater than 0' });
  });

  readonly submitting = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const value = this.model();
      await this.transactionService.updateTransaction(this.transaction(), {
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        amount: value.amount,
      });

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
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

    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set(null);

    try {
      await this.transactionService.deleteTransaction(this.transaction());
      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      this.deleted.emit();
    } catch (err) {
      console.error('Delete transaction error:', err);
      this.errorMessage.set('Unable to delete transaction. Please try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
