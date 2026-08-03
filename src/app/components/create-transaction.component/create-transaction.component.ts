import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import { CATEGORY_NAMES } from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { PrivacyService } from '../../services/privacy.service';

export type EntryType = 'transaction' | 'adjustment';

interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  amount: number;
}

interface AdjustmentFormModel {
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
}

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultTransactionModel(): TransactionFormModel {
  return { date: todayDateInputValue(), description: '', category: '', amount: 0 };
}

function defaultAdjustmentModel(): AdjustmentFormModel {
  return {
    description: '',
    amount: 0,
    startDate: todayDateInputValue(),
    endDate: todayDateInputValue(),
  };
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
  private adjustmentService = inject(AdjustmentService);
  private queryClient = inject(QueryClient);
  readonly privacyService = inject(PrivacyService);

  readonly categories = CATEGORY_NAMES;

  readonly activeTab = signal<EntryType>('transaction');

  readonly isAddition = signal<boolean>(true);

  readonly transactionModel = signal<TransactionFormModel>(defaultTransactionModel());
  readonly adjustmentModel = signal<AdjustmentFormModel>(defaultAdjustmentModel());

  readonly transactionForm = form(this.transactionModel, (schemaPath) => {
    required(schemaPath.date, { message: 'Date is required' });
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    required(schemaPath.category, { message: 'Category is required' });
    min(schemaPath.amount, 0.01, { message: 'Amount must be greater than 0' });
  });

  readonly adjustmentForm = form(this.adjustmentModel, (schemaPath) => {
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    required(schemaPath.startDate, { message: 'Start date is required' });
    required(schemaPath.endDate, { message: 'End date is required' });
    min(schemaPath.amount, 0.01, { message: 'Amount must be greater than 0' });
  });

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  setTab(tab: EntryType): void {
    this.activeTab.set(tab);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  async onSubmitTransaction(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const value = this.transactionModel();
      await this.transactionService.createTransaction({
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        amount: value.amount,
      });

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });

      this.transactionModel.set(defaultTransactionModel());
      this.transactionForm().reset();
      this.successMessage.set('Transaction added');
    } catch (err) {
      this.errorMessage.set('Unable to add transaction. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onSubmitAdjustment(event: Event): Promise<void> {
    event.preventDefault();
    if (this.adjustmentForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const value = this.adjustmentModel();
      await this.adjustmentService.createAdjustment({
        description: value.description.trim(),
        amount: value.amount,
        startDate: value.startDate,
        endDate: value.endDate,
        isAddition: this.isAddition(),
      });

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });

      this.adjustmentModel.set(defaultAdjustmentModel());
      this.adjustmentForm().reset();
      this.successMessage.set('One-Off adjustment added successfully');
    } catch (err) {
      this.errorMessage.set('Unable to add adjustment. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
