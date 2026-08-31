import { Component, computed, inject, output, signal } from '@angular/core';
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental';
import { AuthService } from '../../services/auth.service';
import { computeSplit, SplitzService } from '../../services/splitz.service';
import { PendingTransaction, TransactionService } from '../../services/transaction-service';
import { PEOPLE, PersonSummary } from '../../models/splitz.model';
import {
  categoryRequiresSubcategory,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';

@Component({
  selector: 'app-splitzes-modal',
  standalone: true,
  templateUrl: './splitzes-modal.component.html',
})
export class SplitzesModalComponent {
  close = output<void>();

  private authService = inject(AuthService);
  private splitzService = inject(SplitzService);
  private transactionService = inject(TransactionService);
  private queryClient = inject(QueryClient);
  private splitTxQuery = this.splitzService.getSplitTransactionsQuery();
  private pendingTxQuery = injectQuery(() => ({
    queryKey: ['pendingTransactions'],
    queryFn: () => this.transactionService.fetchPendingTransactions(),
  }));

  readonly isAdmin = this.authService.isAdmin;
  readonly isLoading = computed(() => this.splitTxQuery.isPending());
  readonly isError = computed(() => this.splitTxQuery.isError());
  readonly pendingDrafts = signal<Record<string, PendingTransaction>>({});
  readonly pendingTransactions = computed<PendingTransaction[]>(() => {
    const base = this.pendingTxQuery.data() ?? [];
    const drafts = this.pendingDrafts();

    return base.map((entry) => drafts[entry.id] ?? entry);
  });
  readonly hasPendingTransactions = computed(() => this.pendingTransactions().length > 0);

  readonly personSummaries = computed<PersonSummary[]>(() => {
    const txs = this.splitTxQuery.data() ?? [];
    return this.splitzService.computePersonSummaries(txs);
  });

  readonly markingPersonId = signal<number | null>(null);
  readonly showPendingReview = signal(false);
  readonly isRefreshingPending = signal(false);
  readonly editingPendingId = signal<string | null>(null);
  readonly allPeople = PEOPLE;

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

  startEditingPending(id: string): void {
    const pending = this.pendingTransactions().find((entry) => entry.id === id);
    if (!pending) {
      return;
    }

    this.editingPendingId.set(id);
  }

  cancelEditingPending(): void {
    this.editingPendingId.set(null);
  }

  updatePendingDraft(
    id: string,
    field:
      | 'description'
      | 'category'
      | 'subCategoryId'
      | 'subCategory'
      | 'amount'
      | 'date'
      | 'isSplit'
      | 'paidBy'
      | 'splitBy'
      | 'splitType'
      | 'totalAmount'
      | 'customSplitAmounts',
    value:
      | string
      | number
      | boolean
      | number[]
      | Partial<Record<'me' | number, number>>
      | null,
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

  async onAcceptPending(id: string): Promise<void> {
    const current = this.pendingTransactions().find((entry) => entry.id === id);
    if (!current) {
      return;
    }

    const draft = this.pendingDrafts()[id] ?? current;
    if (categoryRequiresSubcategory(draft.category) && !draft.subCategoryId) {
      return;
    }
    const totalAmount = Number(draft.totalAmount ?? draft.amount ?? 0);
    let finalAmount = Number(draft.amount ?? 0);

    if (draft.isSplit) {
      const splitType = draft.splitType ?? 'split';
      const splitBy = draft.splitBy ?? [];
      const paidBy = draft.paidBy ?? 'me';

      if (splitType === 'onlyMeOwes') {
        finalAmount = totalAmount;
      } else if (splitType === 'onlyTheyOwe') {
        finalAmount = 0;
      } else if (splitType === 'custom') {
        finalAmount = Number(draft.customSplitAmounts?.['me'] ?? 0);
      } else if (splitBy.length > 0) {
        const { myShare } = computeSplit(totalAmount, paidBy, splitBy);
        finalAmount = myShare;
      } else {
        finalAmount = totalAmount;
      }
    }

    try {
      await this.transactionService.acceptPendingTransaction(id, {
        date: draft.date,
        description: draft.description,
        category: draft.category,
        subCategoryId: draft.subCategoryId,
        subCategory: draft.subCategory,
        amount: finalAmount,
        adjustmentId: draft.adjustmentId,
        isSplit: draft.isSplit,
        paidBy: draft.paidBy ?? 'me',
        splitBy: draft.splitBy,
        splitType: draft.splitType,
        totalAmount: totalAmount,
        customSplitAmounts: draft.customSplitAmounts,
      });
      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });
      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
      this.editingPendingId.set(null);
    } catch (error) {
      console.error('Unable to accept pending transaction:', error);
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
    try {
      await this.transactionService.declinePendingTransaction(id);
      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });
    } catch (error) {
      console.error('Unable to decline pending transaction:', error);
    }
  }

  async onMarkPersonSettled(personId: number): Promise<void> {
    if (this.markingPersonId() !== null) return;
    this.markingPersonId.set(personId);
    try {
      const txs = this.splitTxQuery.data() ?? [];
      await this.splitzService.markPersonSettled(personId, txs);
      await this.splitzService.markMePaid(personId, txs);
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
    } finally {
      this.markingPersonId.set(null);
    }
  }

  async onMarkMePaid(personId: number): Promise<void> {
    if (this.markingPersonId() !== null) return;
    this.markingPersonId.set(personId);
    try {
      const txs = this.splitTxQuery.data() ?? [];
      await this.splitzService.markMePaid(personId, txs);
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
    } finally {
      this.markingPersonId.set(null);
    }
  }
}
