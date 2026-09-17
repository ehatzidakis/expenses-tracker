import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, maxLength, min, required } from '@angular/forms/signals';
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
import { computeSplit, SplitzService } from '../../services/splitz.service';
import { PEOPLE, Person } from '../../models/splitz.model';
import { AuthService } from '../../services/auth.service';
import { KioskBalanceComponent } from './kiosk-balance.component';
import { CreateEntryTabsComponent } from './create-entry-tabs.component';
import { TransactionBasicFieldsComponent } from './transaction-basic-fields.component';
import { CreateSplitState, SplitFieldsComponent } from './split-fields.component';
import { TransactionCommentFieldsComponent } from './transaction-comment-fields.component';
import { AdjustmentFieldsComponent } from './adjustment-fields.component';

export type EntryType = 'transaction' | 'adjustment';

interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  subCategory: string;
  comment: string;
  amount: number;
}

interface AdjustmentFormModel {
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  isTrip?: boolean;
  isSelectable?: boolean;
}

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultTransactionModel(): TransactionFormModel {
  return {
    date: todayDateInputValue(),
    description: '',
    category: '',
    subCategoryId: null,
    subCategory: '',
    comment: '',
    amount: 0,
  };
}

function defaultAdjustmentModel(): AdjustmentFormModel {
  return {
    description: '',
    amount: 0.0,
    startDate: todayDateInputValue(),
    endDate: todayDateInputValue(),
    isTrip: false,
    isSelectable: false,
  };
}

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [
    CommonModule,
    KioskBalanceComponent,
    CreateEntryTabsComponent,
    TransactionBasicFieldsComponent,
    SplitFieldsComponent,
    TransactionCommentFieldsComponent,
    AdjustmentFieldsComponent,
  ],
  host: { class: 'block' },
  template: `
    <div
      class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm"
    >
      @if (isKioskMode()) {
        <app-kiosk-balance />
      }
      @if (!isKioskMode()) {
        <app-create-entry-tabs [activeTab]="activeTab()" (tabChange)="setTab($event)" />
      }

      @if (activeTab() === 'transaction') {
        <form (submit)="onSubmitTransaction($event)" class="space-y-4">
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
              [state]="splitState()"
              [allowCustom]="true"
              (stateChange)="applySplitState($event)"
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
              (goesSplitzes() && customSplitMode() && !customSplitValid())
            "
            class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
          >
            {{ submitting() ? 'Adding…' : 'Add Transaction' }}
          </button>
        </form>
      }

      @if (activeTab() === 'adjustment') {
        <form (submit)="onSubmitAdjustment($event)" class="space-y-4">
          <app-adjustment-fields
            [model]="adjustmentModel()"
            [addition]="isAddition()"
            [descriptionField]="adjustmentForm.description"
            [amountField]="adjustmentForm.amount"
            [startDateField]="adjustmentForm.startDate"
            [endDateField]="adjustmentForm.endDate"
            (tripChange)="setIsTrip($event)"
            (selectableChange)="setIsSelectable($event)"
            (additionChange)="isAddition.set($event)"
            (amountChange)="adjustmentModel.update((model) => ({ ...model, amount: $event }))"
          />
          @if (!adjustmentModel().isTrip) {
            <app-split-fields
              [amount]="adjustmentModel().amount"
              [people]="allPeople"
              [state]="splitState()"
              [paidByInputId]="'adj-paid-by'"
              (stateChange)="applySplitState($event)"
              (reset)="resetSplitFields()"
            />
          }
          <button
            type="submit"
            [disabled]="
              adjustmentForm().invalid() || submitting() || privacyService.isPrivacyMode()
            "
            class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
          >
            {{ submitting() ? 'Adding…' : 'Add One-Off' }}
          </button>
        </form>
      }

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
    </div>
  `,
})
export class CreateTransactionComponent {
  private transactionService = inject(TransactionService);
  private adjustmentService = inject(AdjustmentService);
  private splitzService = inject(SplitzService);
  private queryClient = inject(QueryClient);
  private authService = inject(AuthService);
  readonly privacyService = inject(PrivacyService);
  readonly isKioskMode = this.authService.isKiosk;

  readonly regularCategories = CATEGORY_NAMES;
  readonly tripCategories = TRIP_CATEGORY_NAMES;

  readonly activeTab = signal<EntryType>('transaction');

  constructor() {
    effect(() => {
      if (this.authService.isKiosk()) {
        this.applyKioskDefaults();
      }
    });
  }

  private applyKioskDefaults(): void {
    this.activeTab.set('transaction');
    this.goesSplitzes.set(false);
    this.hasComment.set(false);
    this.splitWith.set([]);
    this.paidById.set('me');
    this.customSplitMode.set(false);
    this.customSplitAmounts.set({});
    this.linkWithAdjustment.set(false);
    this.selectedAdjustmentId.set('');
  }

  readonly isAddition = signal<boolean>(true);

  readonly linkWithAdjustment = signal<boolean>(false);
  readonly selectedAdjustmentId = signal<string>('');

  readonly transactionModel = signal<TransactionFormModel>(defaultTransactionModel());
  readonly adjustmentModel = signal<AdjustmentFormModel>(defaultAdjustmentModel());

  // ── Split fields ──────────────────────────────────────────────────────────
  readonly allPeople: Person[] = PEOPLE;
  readonly goesSplitzes = signal<boolean>(false);
  readonly hasComment = signal<boolean>(false);
  readonly splitWith = signal<number[]>([]);
  readonly paidById = signal<'me' | number>('me');
  readonly customSplitMode = signal<boolean>(false);
  readonly customSplitAmounts = signal<Partial<Record<'me' | number, number>>>({});

  readonly splitState = computed<CreateSplitState>(() => ({
    goesSplitzes: this.goesSplitzes(),
    splitWith: this.splitWith(),
    paidById: this.paidById(),
    customSplitMode: this.customSplitMode(),
    customSplitAmounts: this.customSplitAmounts(),
  }));

  readonly customSplitParticipants = computed<Array<'me' | number>>(() => {
    const participants: Array<'me' | number> = ['me', ...this.splitWith()];
    return participants;
  });

  readonly customSplitTotal = computed(() => {
    const amounts = this.customSplitAmounts();
    return this.customSplitParticipants().reduce<number>((sum, participant) => {
      const value = Number(amounts[participant] ?? 0);
      return sum + value;
    }, 0);
  });

  readonly customSplitRemaining = computed(() => {
    const remaining = this.transactionModel().amount - this.customSplitTotal();
    return Math.round(remaining * 100) / 100;
  });

  readonly customSplitValid = computed(() => Math.abs(this.customSplitRemaining()) < 0.005);

  readonly customSplitRemainingLabel = computed(() => {
    const remaining = this.customSplitRemaining();
    if (Math.abs(remaining) < 0.005) {
      return 'All split — €0.00';
    }
    if (remaining > 0) {
      return `€${remaining.toFixed(2)} remaining to be split`;
    }
    return `€${Math.abs(remaining).toFixed(2)} over the total`;
  });

  // ─────────────────────────────────────────────────────────────────────────

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
    // min(schemaPath.amount, 0.01, { message: 'Amount must be greater than 0' });
  });

  readonly adjustmentForm = form(this.adjustmentModel, (schemaPath) => {
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    required(schemaPath.startDate, { message: 'Start date is required' });
    required(schemaPath.endDate, { message: 'End date is required' });
    // min(schemaPath.amount, 0.01, { message: 'Amount must be greater than 0' });
  });

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();
  private splitTransactionsQuery = this.splitzService.getSplitTransactionsQuery();

  readonly kioskNetBalance = computed(() => {
    const stavi = this.allPeople.find((person) => person.name === 'Stavi') ?? this.allPeople[0];
    const summaries = this.splitzService.computePersonSummaries(
      this.splitTransactionsQuery.data() ?? [],
    );
    const summary = summaries.find((entry) => entry.person.id === stavi.id);
    return -(summary?.netWithMe ?? 0);
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

  applySplitState(state: CreateSplitState): void {
    this.goesSplitzes.set(state.goesSplitzes);
    this.splitWith.set(state.splitWith);
    this.paidById.set(state.paidById);
    this.customSplitMode.set(state.customSplitMode);
    this.customSplitAmounts.set(state.customSplitAmounts);
  }

  setTab(tab: EntryType): void {
    if (this.isKioskMode() && tab === 'adjustment') {
      this.activeTab.set('transaction');
      return;
    }

    this.activeTab.set(tab);
    this.resetSplitFields();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  toggleLinkWithAdjustment(value: boolean): void {
    this.linkWithAdjustment.set(value);
    this.transactionModel.update((m) => ({ ...m, category: '' }));
    if (!value) {
      this.selectedAdjustmentId.set('');
    }
  }

  setIsTrip(value: boolean): void {
    this.adjustmentModel.update((m) => ({
      ...m,
      isTrip: value,
      isSelectable: value ? m.isSelectable : false,
      amount: value ? 0.0 : m.amount,
    }));
    if (value) {
      this.isAddition.set(false);
    }
  }

  setIsSelectable(value: boolean): void {
    this.adjustmentModel.update((m) => ({ ...m, isSelectable: value }));
  }

  resetSplitFields(): void {
    if (this.isKioskMode()) {
      this.goesSplitzes.set(false);
      this.hasComment.set(false);
      this.splitWith.set([]);
      this.paidById.set('me');
      this.customSplitMode.set(false);
      this.customSplitAmounts.set({});
      return;
    }

    this.goesSplitzes.set(false);
    this.hasComment.set(false);
    this.splitWith.set([]);
    this.paidById.set('me');
    this.customSplitMode.set(false);
    this.customSplitAmounts.set({});
  }

  setHasComment(value: boolean): void {
    this.hasComment.set(value);
    if (!value) {
      this.transactionModel.update((model) => ({ ...model, comment: '' }));
    }
  }

  async onSubmitTransaction(event: Event): Promise<void> {
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
      const value = this.transactionModel();
      let finalAmount = value.amount;
      const customAmounts: Partial<Record<'me' | number, number>> = this.customSplitMode()
        ? this.customSplitAmounts()
        : {};

      if (this.goesSplitzes()) {
        if (this.customSplitMode()) {
          if (!this.customSplitValid()) {
            this.errorMessage.set(
              `Custom split total must equal €${value.amount.toFixed(2)}. ${this.customSplitRemainingLabel()}`,
            );
            this.submitting.set(false);
            return;
          }
          finalAmount = customAmounts['me'] ?? 0;
        } else if (this.splitWith().length > 0) {
          const { myShare } = computeSplit(value.amount, this.paidById(), this.splitWith());
          finalAmount = myShare;
        }
      }

      const isSplitActive =
        this.goesSplitzes() && (this.splitWith().length > 0 || this.customSplitMode());
      const splitType: 'split' | 'custom' = this.customSplitMode() ? 'custom' : 'split';

      if (categoryRequiresSubcategory(value.category) && !value.subCategoryId) {
        this.errorMessage.set('Please select a subcategory for this ticket transaction.');
        this.submitting.set(false);
        return;
      }

      if (this.customSplitMode() && !this.customSplitValid()) {
        this.errorMessage.set(
          `Custom split total must equal €${value.amount.toFixed(2)}. ${this.customSplitRemainingLabel()}`,
        );
        this.submitting.set(false);
        return;
      }

      await this.transactionService.createTransaction({
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        subCategoryId: value.subCategoryId ?? undefined,
        subCategory: value.subCategory,
        comment: value.comment.trim() || undefined,
        amount: finalAmount,
        adjustmentId: this.linkWithAdjustment() ? this.selectedAdjustmentId() : undefined,
        ...(isSplitActive
          ? {
              isSplit: true,
              paidBy: this.paidById(),
              splitBy: this.splitWith(),
              splitType,
              totalAmount: value.amount,
              ...(this.customSplitMode() ? { customSplitAmounts: customAmounts } : {}),
            }
          : {}),
      });

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
      const value = this.transactionModel();
      const paymentBy = 1 as const;

      if (categoryRequiresSubcategory(value.category) && !value.subCategoryId) {
        this.errorMessage.set('Please select a subcategory for this ticket transaction.');
        this.submitting.set(false);
        return;
      }

      await this.transactionService.createPendingTransaction({
        date: value.date,
        description: value.description.trim(),
        category: value.category,
        subCategoryId: value.subCategoryId ?? undefined,
        subCategory: value.subCategory,
        comment: value.comment.trim() || undefined,
        amount: value.amount,
        adjustmentId: this.linkWithAdjustment() ? this.selectedAdjustmentId() : undefined,
        isSplit: false,
        splitBy: [],
        totalAmount: value.amount,
      });

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

  async onSubmitAdjustment(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isKioskMode()) {
      this.errorMessage.set('One-off adjustments are unavailable for kiosk users.');
      return;
    }
    if (this.adjustmentForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const value = this.adjustmentModel();
      let finalAmount = value.isTrip ? 0.0 : value.amount;

      if (this.goesSplitzes() && this.splitWith().length > 0 && !value.isTrip) {
        const { myShare } = computeSplit(value.amount, this.paidById(), this.splitWith());
        finalAmount = myShare;
      }

      await this.adjustmentService.createAdjustment({
        description: value.description.trim(),
        amount: finalAmount,
        startDate: value.startDate,
        endDate: value.endDate,
        isAddition: value.isTrip ? false : this.isAddition(),
        isTrip: value.isTrip,
        isSelectable: value.isSelectable,
      });

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });

      this.adjustmentModel.set(defaultAdjustmentModel());
      this.adjustmentForm().reset();
      this.resetSplitFields();
      this.successMessage.set('One-Off adjustment added successfully');
    } catch (err) {
      this.errorMessage.set('Unable to add adjustment. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
