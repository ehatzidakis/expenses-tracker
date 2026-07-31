import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import { CATEGORY_NAMES } from '../../services/expense-state.service';

interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  amount: number;
}

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultModel(): TransactionFormModel {
  return { date: todayDateInputValue(), description: '', category: '', amount: 0 };
}

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [CommonModule, FormField],
  host: { class: 'block' },
  templateUrl: './create-transaction.component.html',
})
export class CreateTransactionComponent {
  private transactionService = inject(TransactionService);
  private queryClient = inject(QueryClient);

  readonly categories = CATEGORY_NAMES;

  readonly model = signal<TransactionFormModel>(defaultModel());

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
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly lastAddedTransactionId = signal<string | null>(null);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const value = this.model();
      const newTransactionId = await this.transactionService.createTransaction({
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        amount: value.amount,
      });

      this.lastAddedTransactionId.set(newTransactionId);

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });

      this.model.set(defaultModel());
      this.successMessage.set('Transaction added');
    } catch (err) {
      console.error('Create transaction error:', err);
      this.errorMessage.set('Unable to add transaction. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onDeleteLatest(): Promise<void> {
    const idToDelete = this.lastAddedTransactionId();
    if (!idToDelete || this.deleting()) return;

    this.deleting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      await this.transactionService.deleteTransaction(idToDelete);

      // Clear the ID so they can't click delete again
      this.lastAddedTransactionId.set(null);

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });

      this.successMessage.set('Previous transaction deleted successfully.');
    } catch (err) {
      console.error('Delete transaction error:', err);
      this.errorMessage.set('Unable to delete transaction. Please try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
