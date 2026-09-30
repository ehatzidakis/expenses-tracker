import { CommonModule } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental';
import { AuthService } from '../../services/auth.service';
import { computeSplit, SplitzService } from '../../services/splitz.service';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import {
  normalizePendingForReview,
  normalizePendingSplitOverride,
  PendingTransaction,
  comparePendingTransactionsByDate,
  getPendingTransactionTotalAmount,
  TransactionService,
} from '../../services/transaction-service';
import {
  DebtEntry,
  PEOPLE,
  PersonSummary,
  SplitzSettlementRecord,
} from '../../models/splitz.model';
import {
  categoryRequiresSubcategory,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { resolvePendingCategoryOptions } from '../../services/transaction-service';

@Component({
  selector: 'app-splitzes-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splitzes-modal.component.html',
})
export class SplitzesModalComponent {
  close = output<void>();

  private authService = inject(AuthService);
  private splitzService = inject(SplitzService);
  private settlementService = inject(SplitzSettlementService);
  private transactionService = inject(TransactionService);
  private queryClient = inject(QueryClient);
  private splitTxQuery = this.splitzService.getSplitTransactionsQuery();
  private pendingTxQuery = injectQuery(() => ({
    queryKey: ['pendingTransactions'],
    queryFn: () => this.transactionService.fetchPendingTransactions(),
  }));
  readonly settlementHistoryQuery = this.settlementService.getHistoryQuery();

  readonly isAdmin = this.authService.isAdmin;
  readonly isLoading = computed(() => this.splitTxQuery.isPending());
  readonly isError = computed(() => this.splitTxQuery.isError());
  readonly pendingDrafts = signal<Record<string, PendingTransaction>>({});
  readonly pendingTransactions = computed<PendingTransaction[]>(() => {
    const base = this.pendingTxQuery.data() ?? [];
    const drafts = this.pendingDrafts();

    return base
      .map((entry) => {
        const normalized = normalizePendingForReview(entry);
        const draft = drafts[entry.id];
        return draft ? { ...normalized, ...draft } : normalized;
      })
      .sort(comparePendingTransactionsByDate);
  });
  readonly hasPendingTransactions = computed(() => this.pendingTransactions().length > 0);
  readonly settlementHistory = computed<SplitzSettlementRecord[]>(
    () => this.settlementHistoryQuery.data() ?? [],
  );

  readonly personSummaries = computed<PersonSummary[]>(() => {
    const txs = this.splitTxQuery.data() ?? [];
    return this.splitzService.computePersonSummaries(txs);
  });

  readonly markingPersonId = signal<number | null>(null);
  readonly showPendingReview = signal(false);
  readonly isRefreshingPending = signal(false);
  readonly editingPendingId = signal<string | null>(null);
  readonly pendingAction = signal<{ id: string; action: 'accept' | 'decline' } | null>(null);
  readonly pendingError = signal<{ id: string; message: string } | null>(null);
  readonly settlementConfirmation = signal<{
    personId: number;
    debts: DebtEntry[];
    netWithMe: number;
  } | null>(null);
  readonly showSettlementTransactions = signal(false);
  readonly settlementNote = signal('');
  readonly settlementMessage = signal<string | null>(null);
  readonly allPeople = PEOPLE;

  readonly getPendingCategoryOptions = (pending: PendingTransaction): string[] =>
    resolvePendingCategoryOptions(pending);

  readonly getPendingTotalAmount = getPendingTransactionTotalAmount;

  formatPendingDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    if (![year, month, day].every(Number.isInteger)) {
      return date;
    }

    const localDate = new Date(year, month - 1, day);
    if (
      localDate.getFullYear() !== year ||
      localDate.getMonth() !== month - 1 ||
      localDate.getDate() !== day
    ) {
      return date;
    }

    return localDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  meOwedLabel(netWithMe: number): string {
    if (netWithMe === 0) return 'Settled';
    return netWithMe > 0
      ? `Owes me €${netWithMe.toFixed(2)}`
      : `I owe €${Math.abs(netWithMe).toFixed(2)}`;
  }

  participantName(id: 'me' | number): string {
    if (id === 'me') return 'Me';
    return this.allPeople.find((person) => person.id === id)?.name ?? `Person ${id}`;
  }

  sumDebt(total: number, debt: DebtEntry): number {
    return total + debt.amount;
  }

  absoluteAmount(amount: number): string {
    return Math.abs(amount).toFixed(2);
  }

  requestSettlement(personId: number, direction: 'person-pays-me' | 'i-pay-person'): void {
    const debts = this.splitzService.getDebtsToSettle(
      personId,
      this.splitTxQuery.data() ?? [],
      direction,
    );
    if (debts.length === 0) return;
    this.settlementNote.set('');
    const netWithMe =
      direction === 'person-pays-me'
        ? debts.reduce(this.sumDebt, 0)
        : -debts.reduce(this.sumDebt, 0);
    this.settlementConfirmation.set({ personId, debts, netWithMe });
  }

  requestNetSettlement(personId: number, netWithMe: number): void {
    const debts = this.splitzService.getDebtsBetweenMeAndPerson(
      personId,
      this.splitTxQuery.data() ?? [],
    );
    if (debts.length === 0) return;
    this.settlementNote.set('');
    this.showSettlementTransactions.set(false);
    this.settlementConfirmation.set({ personId, debts, netWithMe });
  }

  cancelSettlement(): void {
    this.settlementConfirmation.set(null);
    this.settlementNote.set('');
    this.showSettlementTransactions.set(false);
  }

  async confirmSettlement(): Promise<void> {
    const confirmation = this.settlementConfirmation();
    if (!confirmation || this.markingPersonId() !== null) return;

    this.markingPersonId.set(confirmation.personId);
    this.settlementMessage.set(null);
    try {
      const transactions = this.splitTxQuery.data() ?? [];
      await this.splitzService.markDebtsSettled(confirmation.debts, transactions);
      await this.settlementService.recordSettlements(confirmation.debts, this.settlementNote());
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitzSettlementHistory'] });
      this.settlementMessage.set('Settlement recorded.');
      this.cancelSettlement();
    } catch (error) {
      console.error('Unable to record Splitzes settlement:', error);
      this.settlementMessage.set('Unable to record settlement. Please try again.');
    } finally {
      this.markingPersonId.set(null);
    }
  }

  pendingActionFor(id: string): 'accept' | 'decline' | null {
    const current = this.pendingAction();
    return current?.id === id ? current.action : null;
  }

  startEditingPending(id: string): void {
    const pending = this.pendingTransactions().find((entry) => entry.id === id);
    if (!pending) {
      return;
    }

    const normalized = normalizePendingForReview(pending);
    this.pendingDrafts.update((drafts) => ({
      ...drafts,
      [id]: { ...normalized },
    }));
    this.pendingError.set(null);
    this.editingPendingId.set(id);
  }

  cancelEditingPending(): void {
    this.pendingError.set(null);
    this.editingPendingId.set(null);
  }

  updatePendingDraft(
    id: string,
    field:
      | 'description'
      | 'category'
      | 'subCategoryId'
      | 'subCategory'
      | 'comment'
      | 'amount'
      | 'date'
      | 'isSplit'
      | 'paidBy'
      | 'splitBy'
      | 'splitType'
      | 'totalAmount'
      | 'customSplitAmounts',
    value: string | number | boolean | number[] | Partial<Record<'me' | number, number>> | null,
  ): void {
    const current = this.pendingTransactions().find((entry) => entry.id === id);
    if (!current) {
      return;
    }

    const nextValue = value as never;
    this.pendingDrafts.update((drafts) => ({
      ...drafts,
      [id]: {
        ...current,
        ...(field === 'splitBy' && Array.isArray(nextValue) ? { splitBy: nextValue } : {}),
        ...(field === 'customSplitAmounts' && nextValue && typeof nextValue === 'object'
          ? { customSplitAmounts: nextValue }
          : {}),
        ...(field !== 'splitBy' && field !== 'customSplitAmounts' ? { [field]: nextValue } : {}),
      },
    }));
  }

  getPendingPaidByOptions(
    pending: PendingTransaction,
  ): Array<{ id: 'me' | number; label: string }> {
    return [
      { id: 'me', label: 'Me' },
      ...(pending.splitBy ?? [])
        .map((personId) => this.allPeople.find((person) => person.id === personId))
        .filter((person): person is (typeof this.allPeople)[number] => person !== undefined)
        .map((person) => ({ id: person.id, label: person.name })),
    ];
  }

  isPendingPaidBy(pending: PendingTransaction, paidBy: 'me' | number): boolean {
    return (pending.paidBy ?? 'me') === paidBy;
  }

  setPendingPaidBy(id: string, paidBy: 'me' | number): void {
    this.updatePendingDraft(id, 'paidBy', paidBy);
  }

  getPendingCustomParticipants(pending: PendingTransaction): Array<'me' | number> {
    return ['me', ...(pending.splitBy ?? [])];
  }

  getPendingCustomValue(pending: PendingTransaction, personId: 'me' | number): string {
    const value = pending.customSplitAmounts?.[personId] ?? 0;
    return value === 0 ? '' : String(value);
  }

  getPendingCustomTotal(pending: PendingTransaction): number {
    const customSplitAmounts = pending.customSplitAmounts ?? {};
    const meShare = Number(customSplitAmounts['me'] ?? 0);
    const otherShare = (pending.splitBy ?? []).reduce((sum, personId) => {
      return sum + Number(customSplitAmounts[personId] ?? 0);
    }, 0);
    return meShare + otherShare;
  }

  onPendingCustomSplitInput(event: Event, pendingId: string, personId: 'me' | number): void {
    const current = this.pendingTransactions().find((entry) => entry.id === pendingId);
    if (!current) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    const amount = parseDecimalInput(normalized);

    const nextAmounts: Partial<Record<'me' | number, number>> = {
      ...(current.customSplitAmounts ?? {}),
      [personId]: amount,
    };

    this.updatePendingDraft(pendingId, 'customSplitAmounts', nextAmounts);

    if (input.value !== normalized && (input.value.includes(',') || input.value.includes('.'))) {
      input.value = normalized;
    }
  }

  toggleSplitParticipant(id: string, personId: number): void {
    const current = this.pendingTransactions().find((entry) => entry.id === id);
    if (!current) {
      return;
    }

    const nextSplitBy = current.splitBy ?? [];
    const updatedSplitBy = nextSplitBy.includes(personId)
      ? nextSplitBy.filter((value) => value !== personId)
      : [...nextSplitBy, personId];

    this.updatePendingDraft(id, 'splitBy', updatedSplitBy);
    this.updatePendingDraft(id, 'isSplit', true);
  }

  readonly getPendingSubcategories = (category: string) => getSubcategoryOptions(category);

  isPendingSubcategorySelected(pending: PendingTransaction, optionId: number): boolean {
    return pending.subCategoryId != null && Number(pending.subCategoryId) === optionId;
  }

  async onAcceptPending(id: string): Promise<void> {
    if (this.pendingAction() !== null) {
      return;
    }

    const current = this.pendingTransactions().find((entry) => entry.id === id);
    if (!current) {
      return;
    }

    const draft = this.pendingDrafts()[id] ?? current;
    if (categoryRequiresSubcategory(draft.category) && !draft.subCategoryId) {
      return;
    }
    const totalAmount = getPendingTransactionTotalAmount(draft);
    let finalAmount = Number(draft.amount ?? 0);

    if (draft.isSplit) {
      const splitType = draft.splitType ?? 'split';
      const splitBy = draft.splitBy ?? [];
      const paidBy = draft.paidBy ?? 'me';

      if (splitType === 'custom') {
        finalAmount = Number(draft.customSplitAmounts?.['me'] ?? 0);
      } else if (splitBy.length > 0) {
        const { myShare } = computeSplit(totalAmount, paidBy, splitBy);
        finalAmount = myShare;
      } else {
        finalAmount = totalAmount;
      }
    }

    this.pendingError.set(null);
    this.pendingAction.set({ id, action: 'accept' });
    try {
      await this.transactionService.acceptPendingTransaction(id, {
        date: draft.date,
        description: draft.description,
        category: draft.category,
        subCategoryId: draft.subCategoryId,
        subCategory: draft.subCategory,
        comment: draft.comment?.trim() || undefined,
        amount: finalAmount,
        adjustmentId: draft.adjustmentId,
        isSplit: draft.isSplit,
        paidBy: draft.paidBy ?? 'me',
        splitBy: draft.splitBy,
        splitType: draft.splitType,
        totalAmount: totalAmount,
        customSplitAmounts: draft.customSplitAmounts,
      });
      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] }),
        this.queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        this.queryClient.invalidateQueries({ queryKey: ['adjustments'] }),
        this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] }),
      ]);
      this.editingPendingId.set(null);
    } catch (error) {
      console.error('Unable to accept pending transaction:', error);
      this.pendingError.set({ id, message: 'Unable to accept. Please try again.' });
    } finally {
      this.pendingAction.set(null);
    }
  }

  async refreshPendingTransactions(): Promise<void> {
    if (this.isRefreshingPending()) {
      return;
    }

    this.isRefreshingPending.set(true);
    try {
      await this.pendingTxQuery.refetch();
    } finally {
      this.isRefreshingPending.set(false);
    }
  }

  async onDeclinePending(id: string): Promise<void> {
    if (this.pendingAction() !== null) {
      return;
    }

    this.pendingError.set(null);
    this.pendingAction.set({ id, action: 'decline' });
    try {
      await this.transactionService.declinePendingTransaction(id);
      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });
    } catch (error) {
      console.error('Unable to decline pending transaction:', error);
      this.pendingError.set({ id, message: 'Unable to decline. Please try again.' });
    } finally {
      this.pendingAction.set(null);
    }
  }

  async onMarkPersonSettled(personId: number): Promise<void> {
    this.requestSettlement(personId, 'person-pays-me');
  }

  async onMarkMePaid(personId: number): Promise<void> {
    this.requestSettlement(personId, 'i-pay-person');
  }
}
