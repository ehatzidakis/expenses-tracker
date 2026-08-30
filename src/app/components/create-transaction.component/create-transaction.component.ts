import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import {
  CATEGORY_NAMES,
  TRIP_CATEGORY_NAMES,
  categoryRequiresSubcategory,
  getCategoryMeta,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { PrivacyService } from '../../services/privacy.service';
import { computeSplit, SplitzService } from '../../services/splitz.service';
import { PEOPLE, Person } from '../../models/splitz.model';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { AuthService } from '../../services/auth.service';

export type EntryType = 'transaction' | 'adjustment';

interface TransactionFormModel {
  date: string;
  description: string;
  category: string;
  subCategoryId: number | null;
  subCategory: string;
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
  imports: [CommonModule, FormField],
  host: { class: 'block' },
  templateUrl: './create-transaction.component.html',
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
    this.splitWith.set([]);
    this.paidById.set('me');
    this.customSplitMode.set(false);
    this.customSplitAmounts.set({});
    this.onlyMeOwes.set(false);
    this.onlyTheyOwe.set(false);
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
  readonly splitWith = signal<number[]>([]);
  readonly paidById = signal<'me' | number>('me');
  readonly customSplitMode = signal<boolean>(false);
  readonly customSplitAmounts = signal<Partial<Record<'me' | number, number>>>({});
  /** When true, only 'me' owes the full amount to the payer — no other participants. */
  readonly onlyMeOwes = signal<boolean>(false);
  /** When true, selected people owe 'me' the full amount split evenly among them. */
  readonly onlyTheyOwe = signal<boolean>(false);

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

  readonly paidByOptions = computed<Array<{ id: 'me' | number; label: string }>>(() => {
    if (this.onlyMeOwes()) {
      // Only show other people (not me) — I can't be the payer if I'm the sole debtor
      return this.allPeople.map((p) => ({ id: p.id as 'me' | number, label: p.name }));
    }
    if (this.onlyTheyOwe()) {
      return [{ id: 'me', label: 'Me' }];
    }
    return [
      { id: 'me', label: 'Me' },
      ...this.splitWith().map((personId) => {
        const person = this.allPeople.find((p) => p.id === personId);
        return { id: personId as 'me' | number, label: person?.name ?? `Person ${personId}` };
      }),
    ];
  });
  // ─────────────────────────────────────────────────────────────────────────

  readonly transactionForm = form(this.transactionModel, (schemaPath) => {
    required(schemaPath.date, { message: 'Date is required' });
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
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

  getCategoryOptionLabel(category: string): string {
    return `${getCategoryMeta(category).emoji} ${category}`;
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

  togglePersonInSplit(personId: number): void {
    if (this.isKioskMode()) {
      return;
    }

    this.onlyMeOwes.set(false);
    this.onlyTheyOwe.set(false);
    if (this.customSplitMode()) {
      this.customSplitMode.set(true);
    }
    this.splitWith.update((current) => {
      const next = current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId];

      if (this.paidById() === personId && !next.includes(personId)) {
        this.paidById.set('me');
      }

      this.customSplitAmounts.update((amounts) => {
        const updated = { ...amounts };
        if (!next.includes(personId)) {
          delete updated[personId];
        }
        return updated;
      });

      return next;
    });
  }

  resetSplitFields(): void {
    if (this.isKioskMode()) {
      this.goesSplitzes.set(false);
      this.splitWith.set([]);
      this.paidById.set('me');
      this.customSplitMode.set(false);
      this.customSplitAmounts.set({});
      this.onlyMeOwes.set(false);
      this.onlyTheyOwe.set(false);
      return;
    }

    this.goesSplitzes.set(false);
    this.splitWith.set([]);
    this.paidById.set('me');
    this.customSplitMode.set(false);
    this.customSplitAmounts.set({});
    this.onlyMeOwes.set(false);
    this.onlyTheyOwe.set(false);
  }

  setCustomSplitMode(value: boolean): void {
    if (this.isKioskMode()) {
      return;
    }

    this.customSplitMode.set(value);
    this.onlyMeOwes.set(false);
    this.onlyTheyOwe.set(false);
    if (value) {
      this.goesSplitzes.set(true);
      this.paidById.set('me');
    }
  }

  setOnlyMeOwes(value: boolean): void {
    if (this.isKioskMode()) {
      return;
    }

    this.customSplitMode.set(false);
    this.onlyMeOwes.set(value);
    this.onlyTheyOwe.set(false);
    if (value) {
      this.splitWith.set([]);
      if (this.paidById() === 'me' && this.allPeople.length > 0) {
        this.paidById.set(this.allPeople[0].id);
      }
    }
  }

  setOnlyTheyOwe(value: boolean): void {
    if (this.isKioskMode()) {
      return;
    }

    this.customSplitMode.set(false);
    this.onlyTheyOwe.set(value);
    this.onlyMeOwes.set(false);
    if (value) {
      this.paidById.set('me');
    }
  }

  getPersonName(personId: 'me' | number): string {
    if (personId === 'me') {
      return 'Me';
    }
    return this.allPeople.find((person) => person.id === personId)?.name ?? `Person ${personId}`;
  }

  getCustomSplitValue(personId: 'me' | number): string {
    const value = this.customSplitAmounts()[personId] ?? 0;
    return value === 0 ? '' : String(value);
  }

  onCustomSplitAmountInput(event: Event, personId: 'me' | number): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    const amount = parseDecimalInput(normalized);

    this.customSplitAmounts.update((current) => ({
      ...current,
      [personId]: amount,
    }));

    if (input.value !== normalized && (input.value.includes(',') || input.value.includes('.'))) {
      input.value = normalized;
    }
  }

  getPaidByName(): string {
    const id = this.paidById();
    if (id === 'me') return 'Me';
    const person = this.allPeople.find((p) => p.id === id);
    return person?.name ?? `Person ${id}`;
  }

  private normalizeAmount(rawValue: string): number {
    const normalized = normalizeDecimalInput(rawValue);
    const parsed = parseDecimalInput(normalized);

    const input = document.activeElement as HTMLInputElement | null;
    if (input && input.value !== normalized && (rawValue.includes(',') || rawValue.includes('.'))) {
      input.value = normalized;
    }

    return parsed;
  }

  onTransactionAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const amount = this.normalizeAmount(input.value);
    this.transactionModel.update((m) => ({ ...m, amount }));
  }

  onAdjustmentAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const amount = this.normalizeAmount(input.value);
    this.adjustmentModel.update((m) => ({ ...m, amount }));
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
        if (this.onlyMeOwes() && this.paidById() !== 'me') {
          finalAmount = value.amount;
        } else if (this.onlyTheyOwe()) {
          finalAmount = 0;
        } else if (this.customSplitMode()) {
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
        this.goesSplitzes() &&
        (this.splitWith().length > 0 ||
          (this.onlyMeOwes() && this.paidById() !== 'me') ||
          this.onlyTheyOwe() ||
          this.customSplitMode());

      const splitType = this.onlyMeOwes()
        ? 'onlyMeOwes'
        : this.onlyTheyOwe()
          ? 'onlyTheyOwe'
          : this.customSplitMode()
            ? 'custom'
            : 'split';

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
        amount: finalAmount,
        adjustmentId: this.linkWithAdjustment() ? this.selectedAdjustmentId() : undefined,
        ...(isSplitActive
          ? {
              isSplit: true,
              paidBy: this.onlyTheyOwe() ? 'me' : this.paidById(),
              splitBy: this.onlyMeOwes() ? [] : this.splitWith(),
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
