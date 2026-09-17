import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import {
  CATEGORY_NAMES,
  TRIP_CATEGORY_NAMES,
  categoryRequiresSubcategory,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { PrivacyService } from '../../services/privacy.service';
import { AuthService } from '../../services/auth.service';
import { PEOPLE, Person } from '../../models/splitz.model';
import { TransactionBasicFieldsComponent } from './transaction-basic-fields.component';
import { SplitFieldsComponent } from './split-fields.component';
import { TransactionCommentFieldsComponent } from './transaction-comment-fields.component';
import { SplitStateStore } from './split-state.store';
import { TransactionFormModel, defaultTransactionModel } from './create-transaction.models';
import {
  buildKioskPayload,
  buildTransactionPayload,
  customSplitValid as isCustomSplitValid,
} from './transaction-payload';

@Component({
  selector: 'app-create-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    TransactionBasicFieldsComponent,
    SplitFieldsComponent,
    TransactionCommentFieldsComponent,
  ],
  host: { class: 'block' },
  template: `
    <form (submit)="onSubmit($event)" class="space-y-4">
      <app-transaction-basic-fields
        [model]="transactionModel()"
        [categories]="activeCategories()"
        [linked]="linkWithAdjustment()"
        [trips]="selectableTrips()"
        [selectedTripId]="selectedAdjustmentId()"
        [dateField]="transactionForm.date"
        [descriptionField]="transactionForm.description"
        [categoryField]="transactionForm.category"
        [subCategoryField]="transactionForm.subCategoryId"
        [amountField]="transactionForm.amount"
        (linkChange)="toggleLinkWithAdjustment($event)"
        (tripChange)="selectedAdjustmentId.set($event)"
        (categoryChange)="setCategory($event)"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="transactionModel.update((model) => ({ ...model, amount: $event }))"
      />
      @if (!isKioskMode()) {
        <app-split-fields
          [amount]="transactionModel().amount"
          [people]="allPeople"
          [state]="splitStore.state()"
          [allowCustom]="true"
          (stateChange)="splitStore.apply($event)"
          (reset)="resetSplitFields()"
        />
      }
      <app-transaction-comment-fields
        [enabled]="hasComment()"
        [commentField]="transactionForm.comment"
        (commentToggle)="setHasComment($event)"
      />
      <button
        type="submit"
        [disabled]="
          transactionForm().invalid() ||
          submitting() ||
          privacyService.isPrivacyMode() ||
          (splitStore.goesSplitzes() && splitStore.customSplitMode() && !customSplitOk())
        "
        class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
      >
        {{ submitting() ? 'Adding…' : 'Add Transaction' }}
      </button>
    </form>

    @if (successMessage()) {
      <div
        class="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs"
      >
        <span>{{ successMessage() }}</span>
      </div>
    }
    @if (errorMessage()) {
      <div class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
        {{ errorMessage() }}
      </div>
    }
  `,
})
export class CreateTransactionFormComponent {
  private transactionService = inject(TransactionService);
  private adjustmentService = inject(AdjustmentService);
  private queryClient = inject(QueryClient);
  private authService = inject(AuthService);
  readonly privacyService = inject(PrivacyService);
  readonly splitStore = inject(SplitStateStore);
  readonly isKioskMode = this.authService.isKiosk;

  readonly regularCategories = CATEGORY_NAMES;
  readonly tripCategories = TRIP_CATEGORY_NAMES;
  readonly allPeople: Person[] = PEOPLE;

  readonly linkWithAdjustment = signal<boolean>(false);
  readonly selectedAdjustmentId = signal<string>('');
  readonly hasComment = signal<boolean>(false);

  readonly transactionModel = signal<TransactionFormModel>(defaultTransactionModel());

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();

  readonly transactionForm = form(this.transactionModel, (schemaPath) => {
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

  readonly selectableTrips = computed(() =>
    (this.adjustmentsQuery.data() ?? []).filter((a) => a.isTrip && a.isSelectable),
  );

  readonly activeCategories = computed(() =>
    this.linkWithAdjustment() ? this.tripCategories : this.regularCategories,
  );

  readonly availableSubcategories = computed(() => {
    const category = this.transactionModel().category;
    return category ? getSubcategoryOptions(category) : [];
  });

  readonly customSplitOk = computed(() =>
    isCustomSplitValid(this.transactionModel().amount, this.splitStore.state()),
  );

  constructor() {
    effect(() => {
      if (this.authService.isKiosk()) {
        this.linkWithAdjustment.set(false);
        this.selectedAdjustmentId.set('');
        this.hasComment.set(false);
      }
    });
  }

  private syncSubcategorySelection(category: string): void {
    const hasSubcategories = categoryRequiresSubcategory(category);
    if (!hasSubcategories) {
      this.transactionModel.update((model) => ({
        ...model,
        category,
        subCategoryId: null,
        subCategory: '',
      }));
      return;
    }

    const current = this.transactionModel();
    if (
      current.subCategoryId == null ||
      !this.availableSubcategories().some((opt) => opt.id === current.subCategoryId)
    ) {
      const firstOption = this.availableSubcategories()[0];
      this.transactionModel.update((model) => ({
        ...model,
        category,
        subCategoryId: firstOption?.id ?? null,
        subCategory: firstOption?.name ?? '',
      }));
      return;
    }

    this.transactionModel.update((model) => ({
      ...model,
      category,
      subCategory:
        this.availableSubcategories().find((opt) => opt.id === model.subCategoryId)?.name ?? '',
    }));
  }

  setCategory(category: string): void {
    this.transactionModel.update((model) => ({ ...model, category }));
    this.syncSubcategorySelection(category);
  }

  setSubcategory(subCategoryId: number | null): void {
    const option = this.availableSubcategories().find((item) => item.id === subCategoryId) ?? null;
    this.transactionModel.update((model) => ({
      ...model,
      subCategoryId: option?.id ?? null,
      subCategory: option?.name ?? '',
    }));
  }

  toggleLinkWithAdjustment(value: boolean): void {
    this.linkWithAdjustment.set(value);
    this.transactionModel.update((m) => ({ ...m, category: '' }));
    if (!value) {
      this.selectedAdjustmentId.set('');
    }
  }

  setHasComment(value: boolean): void {
    this.hasComment.set(value);
    if (!value) {
      this.transactionModel.update((model) => ({ ...model, comment: '' }));
    }
  }

  resetSplitFields(): void {
    this.splitStore.reset();
    this.hasComment.set(false);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }
    if (this.linkWithAdjustment() && !this.selectedAdjustmentId()) {
      this.errorMessage.set('Please select a trip to link with.');
      return;
    }
    if (this.isKioskMode()) {
      this.submitKioskTransaction();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = buildTransactionPayload(this.transactionModel(), this.splitStore.state(), {
        linked: this.linkWithAdjustment(),
        adjustmentId: this.selectedAdjustmentId(),
      });
      if (!result.ok) {
        this.errorMessage.set(result.error);
        this.submitting.set(false);
        return;
      }

      await this.transactionService.createTransaction(result.payload);

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });

      this.transactionModel.set(defaultTransactionModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.successMessage.set('Transaction added');
    } catch (err) {
      this.errorMessage.set('Unable to add transaction. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async submitKioskTransaction(): Promise<void> {
    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = buildKioskPayload(this.transactionModel(), {
        linked: this.linkWithAdjustment(),
        adjustmentId: this.selectedAdjustmentId(),
      });
      if (!result.ok) {
        this.errorMessage.set(result.error);
        this.submitting.set(false);
        return;
      }

      await this.transactionService.createPendingTransaction(result.payload);

      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });

      this.transactionModel.set(defaultTransactionModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.successMessage.set('Transaction sent for approval');
    } catch (err) {
      console.error('Kiosk approval submission failed:', err);
      const message =
        err instanceof Error ? err.message : 'Unable to submit kiosk transaction for approval.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
