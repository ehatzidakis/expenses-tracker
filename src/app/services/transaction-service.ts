import { inject, Injectable } from '@angular/core';
import {
  collection,
  count,
  deleteDoc,
  deleteField,
  doc,
  getAggregate,
  getDocs,
  getDoc,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  sum,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Transaction } from '../models/transaction.model';
import { db } from '../firebase.config';
import { CATEGORY_NAMES } from './expense-state.service';
import { AuthService } from './auth.service';
import { BudgetSettingsService } from './budget-settings.service';
import { SyncMarkerService } from './sync-marker.service';

export interface TransactionPage {
  items: Transaction[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/** One row of a server-side total: e.g. all Utilities with subCategoryId 12. */
export interface CategoryStatGroup {
  category: string;
  subCategoryId?: number;
}

export interface CategoryStat {
  count: number;
  sum: number;
}

/** 'Utilities' or 'Utilities:12'. */
export function categoryStatKey(group: CategoryStatGroup): string {
  return group.subCategoryId == null ? group.category : `${group.category}:${group.subCategoryId}`;
}

// Keys start with 'expenses' so the existing ['expenses'] invalidation after saves refreshes them.
export const monthTransactionsKey = (monthName: string) => ['expenses', 'month-tx', monthName];
export const tripTransactionsKey = (adjustmentId: string) => ['expenses', 'trip-tx', adjustmentId];

function timestampOf(value: string | undefined): number {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Sort comparator: newest date first, then newest createdAt. */
export function compareNewestFirst(a: Transaction, b: Transaction): number {
  const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();
  return dateDifference || timestampOf(b.createdAt) - timestampOf(a.createdAt);
}

// Kiosk users add pending items from other devices without bumping the sync marker,
// so the pending list goes stale sooner than the rest.
export const PENDING_STALE_TIME = 1000 * 60 * 5;

export interface NewTransactionInput {
  date: string; // 'YYYY-MM-DD'
  description: string;
  category: string;
  subCategoryId?: number;
  subCategory?: string;
  comment?: string;
  amount: number;
  adjustmentId?: string; // Optional: ID of the associated adjustment, if any
  // Optional split metadata
  isSplit?: boolean;
  paidBy?: 'me' | number;
  splitBy?: number[];
  splitType?: 'split' | 'custom';
  totalAmount?: number;
  customSplitAmounts?: Partial<Record<'me' | number, number>>;
}

export interface PendingTransaction extends NewTransactionInput {
  id: string;
  createdAt: string;
  createdByUid?: string;
  sourceRole: 'kiosk' | 'admin';
  status: 'pending';
}

/** Full bill for a split, otherwise the amount itself. */
export function getTransactionTotalAmount(
  input: Pick<NewTransactionInput, 'amount' | 'totalAmount' | 'isSplit'>,
): number {
  const amount = Number(input.amount) || 0;
  const totalAmount = Number(input.totalAmount);

  return input.isSplit && Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : amount;
}

export const getPendingTransactionTotalAmount = getTransactionTotalAmount;

const SPLIT_FIELDS = [
  'paidBy',
  'splitBy',
  'splitType',
  'totalAmount',
  'customSplitAmounts',
  'splitPaidPersonIds',
] as const;

/**
 * Split fields to write when a transaction is edited.
 * `input.isSplit` undefined means "leave split data alone" (used when the split is locked).
 */
export function splitUpdateFields(
  oldTx: Pick<Transaction, 'isSplit' | 'splitPaidPersonIds'>,
  input: NewTransactionInput,
): { set: Record<string, unknown>; clear: string[] } {
  if (input.isSplit === true) {
    const splitType = input.splitType ?? 'split';
    const set: Record<string, unknown> = {
      isSplit: true,
      paidBy: input.paidBy ?? 'me',
      splitBy: input.splitBy ?? [],
      splitType,
      totalAmount: input.totalAmount ?? input.amount,
    };
    if (!oldTx.isSplit) {
      set['splitPaidPersonIds'] = [];
    }
    if (splitType === 'custom') {
      set['customSplitAmounts'] = input.customSplitAmounts ?? {};
      return { set, clear: [] };
    }
    return { set, clear: ['customSplitAmounts'] };
  }

  if (input.isSplit === false && oldTx.isSplit) {
    return { set: { isSplit: false }, clear: [...SPLIT_FIELDS] };
  }

  return { set: {}, clear: [] };
}

export function comparePendingTransactionsByDate(
  left: Pick<PendingTransaction, 'date' | 'id'>,
  right: Pick<PendingTransaction, 'date' | 'id'>,
): number {
  const leftTime = Date.parse(`${left.date}T00:00:00`);
  const rightTime = Date.parse(`${right.date}T00:00:00`);

  if (Number.isNaN(leftTime)) {
    return Number.isNaN(rightTime) ? left.id.localeCompare(right.id) : 1;
  }
  if (Number.isNaN(rightTime)) {
    return -1;
  }

  return leftTime - rightTime || left.id.localeCompare(right.id);
}

export const DEFAULT_PENDING_SPLIT_PAID_BY = 1 as const;
export const DEFAULT_PENDING_SPLIT_WITH = [1] as const;

export function resolvePendingCategoryOptions(
  input: Partial<Pick<NewTransactionInput, 'category' | 'adjustmentId'>> = {},
): string[] {
  const hasLinkedAdjustment = Boolean(input.adjustmentId);
  const category = input.category ?? '';

  const tripCategories = [
    'Plane Tickets',
    'Accommodation',
    'Food',
    'Transportation',
    'Gifts',
    'Activities',
    'Attractions',
    'Splurge',
    'Miscellaneous',
  ];

  const standardCategories = [
    'Supermarket',
    'Medical',
    'Personal',
    'EatingOut',
    'Utilities',
    'Takeaway',
    'Tickets',
    'Gaming',
    'Cats',
    'Travel',
    'Subscriptions',
    'Gym',
    'Food',
  ];

  if (hasLinkedAdjustment) {
    return tripCategories.includes(category) ? tripCategories : tripCategories;
  }

  return standardCategories.includes(category)
    ? [...new Set([category, ...standardCategories])]
    : standardCategories;
}

export function normalizePendingSplitOverride<T extends Partial<NewTransactionInput>>(
  input: T,
): T & {
  isSplit: boolean;
  paidBy: 'me' | number;
  splitBy: number[];
  splitType: 'split' | 'custom';
  customSplitAmounts?: Partial<Record<'me' | number, number>>;
} {
  return {
    ...input,
    isSplit: true,
    paidBy: DEFAULT_PENDING_SPLIT_PAID_BY,
    splitBy: [...DEFAULT_PENDING_SPLIT_WITH],
    splitType: 'split',
    customSplitAmounts: undefined,
  };
}

/**
 * Kiosk entries get the default split on accept only when the reviewer
 * didn't make a split choice; otherwise the reviewer's split is kept.
 */
export function resolvePendingAcceptSplit<T extends Partial<NewTransactionInput>>(
  sourceRole: PendingTransaction['sourceRole'],
  input: T,
  overrides?: Partial<NewTransactionInput>,
): T {
  const reviewerChoseSplit = overrides?.isSplit !== undefined;
  return sourceRole === 'kiosk' && !reviewerChoseSplit
    ? normalizePendingSplitOverride(input)
    : input;
}

export function normalizePendingForReview(input: PendingTransaction): PendingTransaction {
  return input.sourceRole === 'kiosk'
    ? (normalizePendingSplitOverride(input) as PendingTransaction)
    : input;
}

const PAGE_SIZE = 10;

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function normalizeComment(value: unknown): string | undefined {
  const comment = typeof value === 'string' ? value.trim() : '';
  return comment || undefined;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function monthNameFromDateString(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return `${MONTH_NAMES[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly authService = inject(AuthService);
  private readonly budgetSettingsService = inject(BudgetSettingsService);
  private readonly acceptingPendingIds = new Set<string>();
  private readonly syncMarker = inject(SyncMarkerService);

  /**
   * Every transaction in the given month ('November 2026'), trip ones included.
   * Shared by several screens through monthTransactionsKey; callers filter what they need.
   */
  async fetchMonthTransactions(monthName: string): Promise<Transaction[]> {
    const snapshot = await getDocs(
      query(collection(db, 'transactions'), where('monthName', '==', monthName)),
    );

    return snapshot.docs.map((document) => this.mapTransaction(document.data(), document.id));
  }

  /** Every transaction linked to a trip. */
  async fetchTripTransactions(adjustmentId: string): Promise<Transaction[]> {
    const snapshot = await getDocs(
      query(collection(db, 'transactions'), where('adjustmentId', '==', adjustmentId)),
    );

    return snapshot.docs.map((document) => this.mapTransaction(document.data(), document.id));
  }

  /**
   * Count and total amount per group, calculated by Firestore.
   * Costs about 1 read per group instead of 1 read per transaction.
   */
  async fetchCategoryStats(groups: CategoryStatGroup[]): Promise<Record<string, CategoryStat>> {
    const transactionsRef = collection(db, 'transactions');
    const entries = await Promise.all(
      groups.map(async (group) => {
        const filters = [where('category', '==', group.category)];
        if (group.subCategoryId != null) {
          filters.push(where('subCategoryId', '==', group.subCategoryId));
        }
        const snapshot = await getAggregate(query(transactionsRef, ...filters), {
          count: count(),
          sum: sum('amount'),
        });
        const data = snapshot.data();
        const stat: CategoryStat = { count: data.count, sum: Number(data.sum) || 0 };
        return [categoryStatKey(group), stat] as const;
      }),
    );
    return Object.fromEntries(entries);
  }

  async fetchPage(
    monthName: string,
    category: string,
    cursor: QueryDocumentSnapshot<DocumentData> | null,
  ): Promise<TransactionPage> {
    return this.fetchPagedTransactions(
      [where('monthName', '==', monthName), where('category', '==', category)],
      cursor,
    );
  }

  async fetchPageByCategory(
    category: string,
    cursor: QueryDocumentSnapshot<DocumentData> | null,
    sortByAmount = false,
    subCategoryId?: number | null,
  ): Promise<TransactionPage> {
    const filters = [where('category', '==', category)];
    if (subCategoryId != null && subCategoryId !== 0) {
      filters.push(where('subCategoryId', '==', subCategoryId));
    }

    return this.fetchPagedTransactions(filters, cursor, sortByAmount);
  }

  async fetchPageByDescription(
    description: string,
    cursor: QueryDocumentSnapshot<DocumentData> | null,
    sortByAmount = false,
  ): Promise<TransactionPage> {
    return this.fetchPagedTransactions(
      [where('description', '==', description)],
      cursor,
      sortByAmount,
    );
  }

  private async fetchPagedTransactions(
    filters: QueryConstraint[],
    cursor: QueryDocumentSnapshot<DocumentData> | null,
    sortByAmount = false,
  ): Promise<TransactionPage> {
    const transactionsRef = collection(db, 'transactions');
    const constraints: QueryConstraint[] = [
      ...filters,
      ...(sortByAmount
        ? [orderBy('amount', 'desc'), orderBy('date', 'desc')]
        : [orderBy('date', 'desc')]),
      limit(PAGE_SIZE + 1),
    ];

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    const snapshot = await getDocs(query(transactionsRef, ...constraints));
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const docs = snapshot.docs.slice(0, PAGE_SIZE);

    return {
      items: docs.map((doc) => {
        const data = doc.data();
        const tx: Transaction = {
          id: doc.id,
          monthName: data['monthName'],
          date: data['date'],
          description: data['description'],
          amount: Number(data['amount']) || 0,
          category: data['category'],
          subCategoryId: data['subCategoryId'] != null ? Number(data['subCategoryId']) : undefined,
          subCategory: (data['subCategory'] as string | undefined) ?? undefined,
          comment: normalizeComment(data['comment']),
          createdAt: data['createdAt'],
          adjustmentId: data['adjustmentId'] ?? undefined,
        };
        if (data['isSplit']) {
          tx.isSplit = true;
          tx.paidBy = data['paidBy'] as 'me' | number;
          tx.splitBy = (data['splitBy'] as number[]) ?? [];
          tx.splitType = (data['splitType'] as 'split' | 'custom') ?? 'split';
          tx.totalAmount = Number(data['totalAmount']) || 0;
          tx.customSplitAmounts =
            (data['customSplitAmounts'] as Partial<Record<'me' | number, number>> | undefined) ??
            undefined;
          tx.splitPaidPersonIds = (data['splitPaidPersonIds'] as number[]) ?? [];
        }
        return tx;
      }),
      lastDoc: docs.length ? docs[docs.length - 1] : null,
      hasMore,
    };
  }

  private mapTransaction(data: DocumentData, id: string): Transaction {
    const tx: Transaction = {
      id,
      monthName: data['monthName'] as string,
      date: data['date'] as string,
      description: data['description'] as string,
      amount: Number(data['amount']) || 0,
      category: data['category'] as string,
      subCategoryId: data['subCategoryId'] != null ? Number(data['subCategoryId']) : undefined,
      subCategory: (data['subCategory'] as string | undefined) ?? undefined,
      comment: normalizeComment(data['comment']),
      createdAt: (data['createdAt'] as string) ?? '',
      adjustmentId: (data['adjustmentId'] as string) ?? undefined,
    };

    if (data['isSplit']) {
      tx.isSplit = true;
      tx.paidBy = data['paidBy'] as 'me' | number;
      tx.splitBy = (data['splitBy'] as number[]) ?? [];
      tx.splitType = (data['splitType'] as 'split' | 'custom') ?? 'split';
      tx.totalAmount = Number(data['totalAmount']) || 0;
      tx.customSplitAmounts =
        (data['customSplitAmounts'] as Partial<Record<'me' | number, number>> | undefined) ??
        undefined;
      tx.splitPaidPersonIds = (data['splitPaidPersonIds'] as number[]) ?? [];
    }

    return tx;
  }

  getPendingTransactionsQuery() {
    return injectQuery(() => ({
      queryKey: ['pendingTransactions'],
      staleTime: PENDING_STALE_TIME,
      queryFn: () => this.fetchPendingTransactions(),
    }));
  }

  async fetchPendingTransactions(): Promise<PendingTransaction[]> {
    const snapshot = await getDocs(collection(db, 'adjustments-temp'));

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const sourceRole = data['sourceRole'] === 'admin' ? 'admin' : 'kiosk';
      const base: PendingTransaction = {
        id: docSnap.id,
        date: data['date'] as string,
        description: data['description'] as string,
        category: data['category'] as string,
        subCategoryId: data['subCategoryId'] != null ? Number(data['subCategoryId']) : undefined,
        subCategory: (data['subCategory'] as string | undefined) ?? undefined,
        comment: normalizeComment(data['comment']),
        amount: Number(data['amount']) || 0,
        adjustmentId: (data['adjustmentId'] as string | undefined) ?? undefined,
        isSplit: Boolean(data['isSplit']),
        paidBy: data['paidBy'] as 'me' | number | undefined,
        splitBy: (data['splitBy'] as number[]) ?? [],
        splitType: (data['splitType'] as 'split' | 'custom') ?? 'split',
        totalAmount: Number(data['totalAmount']) || 0,
        customSplitAmounts:
          (data['customSplitAmounts'] as Partial<Record<'me' | number, number>> | undefined) ??
          undefined,
        createdAt: (data['createdAt'] as string) ?? new Date().toISOString(),
        createdByUid: (data['createdByUid'] as string | undefined) ?? undefined,
        sourceRole,
        status: (data['status'] as 'pending') ?? 'pending',
      };

      return normalizePendingForReview(base);
    });
  }

  async createPendingTransaction(
    input: NewTransactionInput,
    sourceRole: PendingTransaction['sourceRole'] = 'kiosk',
  ): Promise<string> {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) {
      throw new Error('Kiosk user is not authenticated. Please sign in again.');
    }

    const pendingRef = doc(collection(db, 'adjustments-temp'));
    const pendingData = stripUndefinedFields({
      ...input,
      isSplit: input.isSplit ?? false,
      splitBy: input.splitBy ?? [],
      totalAmount: input.totalAmount ?? input.amount,
      createdAt: new Date().toISOString(),
      createdByUid: currentUser.uid,
      sourceRole,
      status: 'pending' as const,
    });

    await setDoc(pendingRef, pendingData);
    return pendingRef.id;
  }

  async updatePendingTransaction(id: string, input: Partial<NewTransactionInput>): Promise<void> {
    const pendingRef = doc(db, 'adjustments-temp', id);
    const sanitized = stripUndefinedFields({
      ...input,
      totalAmount: input.totalAmount ?? input.amount,
    });

    await updateDoc(pendingRef, sanitized);
  }

  async acceptPendingTransaction(
    id: string,
    overrides?: Partial<NewTransactionInput>,
  ): Promise<void> {
    // The pending doc is only deleted at the end, so a concurrent call would create a duplicate.
    if (this.acceptingPendingIds.has(id)) {
      return;
    }

    this.acceptingPendingIds.add(id);
    try {
      await this.commitPendingTransaction(id, overrides);
    } finally {
      this.acceptingPendingIds.delete(id);
    }
  }

  private async commitPendingTransaction(
    id: string,
    overrides?: Partial<NewTransactionInput>,
  ): Promise<void> {
    const pendingRef = doc(db, 'adjustments-temp', id);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
      return;
    }

    const data = pendingSnap.data();
    const sourceRole = data['sourceRole'] === 'admin' ? 'admin' : 'kiosk';
    const pendingInput = {
      ...data,
      ...overrides,
      date: (overrides?.date ?? data['date'] ?? new Date().toISOString().slice(0, 10)) as string,
      description: (overrides?.description ??
        data['description'] ??
        'Pending transaction') as string,
      category: (overrides?.category ?? data['category'] ?? 'Utilities') as string,
      subCategoryId:
        overrides?.subCategoryId ??
        (data['subCategoryId'] != null ? Number(data['subCategoryId']) : undefined),
      subCategory:
        overrides?.subCategory ?? (data['subCategory'] as string | undefined) ?? undefined,
      comment: overrides?.comment ?? normalizeComment(data['comment']),
      amount: Number(overrides?.amount ?? data['amount'] ?? 0),
      adjustmentId: (overrides?.adjustmentId ?? data['adjustmentId']) as string | undefined,
      totalAmount: Number(overrides?.totalAmount ?? data['totalAmount'] ?? data['amount'] ?? 0),
    };
    const resolvedInput = resolvePendingAcceptSplit(sourceRole, pendingInput, overrides);

    const input: NewTransactionInput = {
      date: resolvedInput.date as string,
      description: resolvedInput.description as string,
      category: resolvedInput.category as string,
      subCategoryId: resolvedInput.subCategoryId,
      subCategory: resolvedInput.subCategory,
      comment: resolvedInput.comment,
      amount: Number(resolvedInput.amount ?? 0),
      adjustmentId: resolvedInput.adjustmentId,
      isSplit: resolvedInput.isSplit,
      paidBy: resolvedInput.paidBy,
      splitBy: resolvedInput.splitBy,
      splitType: resolvedInput.splitType,
      totalAmount: Number(resolvedInput.totalAmount ?? resolvedInput.amount ?? 0),
      customSplitAmounts: resolvedInput.customSplitAmounts,
    };

    await this.createTransaction(input);
    await deleteDoc(pendingRef);
  }

  async declinePendingTransaction(id: string): Promise<void> {
    await deleteDoc(doc(db, 'adjustments-temp', id));
  }

  async createTransaction(input: NewTransactionInput): Promise<string> {
    const monthName = monthNameFromDateString(input.date);
    const createdAt = new Date().toISOString();

    const isTripTransaction = Boolean(input.adjustmentId); // Determine if this is a trip transaction based on the presence of an adjustmentId

    const batch = writeBatch(db);

    if (!isTripTransaction) {
      const expensesRef = collection(db, 'expenses');
      const existingSnapshot = await getDocs(
        query(expensesRef, where('MonthName', '==', monthName)),
      );
      const existingExpenseDoc = existingSnapshot.docs[0] ?? null;

      if (existingExpenseDoc) {
        batch.update(existingExpenseDoc.ref, { [input.category]: increment(input.amount) });
      } else {
        const newExpense: Record<string, string | number> = {
          MonthName: monthName,
          TotalWage: this.budgetSettingsService.getDefaultTotalWage(),
        };
        for (const name of CATEGORY_NAMES) {
          newExpense[name] = name === input.category ? input.amount : 0;
        }
        batch.set(doc(collection(db, 'expenses')), newExpense);
      }
    } else if (input.adjustmentId) {
      const adjustmentRef = doc(db, 'adjustments', input.adjustmentId);
      batch.update(adjustmentRef, { amount: increment(input.amount) });
    }

    const transactionRef = doc(collection(db, 'transactions'));
    const txData: Record<string, unknown> = {
      monthName,
      date: input.date,
      description: input.description,
      amount: input.amount,
      category: input.category,
      createdAt,
    };
    if (input.subCategoryId != null) {
      txData['subCategoryId'] = input.subCategoryId;
      txData['subCategory'] = input.subCategory ?? '';
    }
    if (input.comment !== undefined) {
      txData['comment'] = input.comment.trim();
    }
    if (input.adjustmentId) {
      txData['adjustmentId'] = input.adjustmentId;
    }
    if (input.isSplit) {
      const paidBy = input.paidBy ?? 'me';
      const splitBy = input.splitBy ?? [];
      const splitType = input.splitType ?? 'split';

      txData['isSplit'] = true;
      txData['paidBy'] = paidBy;
      txData['splitBy'] = splitBy;
      txData['splitType'] = splitType;
      txData['totalAmount'] = input.totalAmount ?? input.amount;
      if (input.customSplitAmounts) {
        txData['customSplitAmounts'] = input.customSplitAmounts;
      }
      txData['splitPaidPersonIds'] = [];
    }
    batch.set(transactionRef, txData);

    await batch.commit();
    await this.syncMarker.bump();

    return transactionRef.id;
  }

  async updateTransaction(oldTx: Transaction, input: NewTransactionInput): Promise<void> {
    const newMonthName = monthNameFromDateString(input.date);
    const isTripTransaction = Boolean(oldTx.adjustmentId); // Determine if this is a trip transaction based on the presence of an adjustmentId
    const batch = writeBatch(db);
    const expensesRef = collection(db, 'expenses');

    if (!isTripTransaction) {
      // 1. Revert old amount from original month & category summary
      const oldExpenseSnap = await getDocs(
        query(expensesRef, where('MonthName', '==', oldTx.monthName)),
      );
      const oldExpenseDoc = oldExpenseSnap.docs[0] ?? null;

      if (oldExpenseDoc) {
        batch.update(oldExpenseDoc.ref, {
          [oldTx.category]: increment(-oldTx.amount),
        });
      }

      // 2. Apply new amount to new month & category summary
      const newExpenseSnap = await getDocs(
        query(expensesRef, where('MonthName', '==', newMonthName)),
      );
      const newExpenseDoc = newExpenseSnap.docs[0] ?? null;

      if (newExpenseDoc) {
        batch.update(newExpenseDoc.ref, {
          [input.category]: increment(input.amount),
        });
      } else {
        // If transitioning to a new month that doesn't exist yet in expenses
        const newExpense: Record<string, string | number> = {
          MonthName: newMonthName,
          TotalWage: this.budgetSettingsService.getDefaultTotalWage(),
        };
        for (const name of CATEGORY_NAMES) {
          newExpense[name] = name === input.category ? input.amount : 0;
        }
        batch.set(doc(expensesRef), newExpense);
      }
    } else if (oldTx.adjustmentId) {
      // Keep linked trip total in sync with transaction edits
      const delta = input.amount - oldTx.amount;
      if (delta !== 0) {
        const adjustmentRef = doc(db, 'adjustments', oldTx.adjustmentId);
        batch.update(adjustmentRef, { amount: increment(delta) });
      }
    }

    // 3. Update the transaction document itself
    const txRef = doc(db, 'transactions', oldTx.id);
    const updateData: Record<string, unknown> = {
      date: input.date,
      monthName: newMonthName,
      description: input.description,
      category: input.category,
      amount: input.amount,
    };
    if (input.subCategoryId != null) {
      updateData['subCategoryId'] = input.subCategoryId;
      updateData['subCategory'] = input.subCategory ?? '';
    } else if (oldTx.subCategoryId != null) {
      updateData['subCategoryId'] = -1;
      updateData['subCategory'] = '';
    }
    updateData['comment'] = input.comment?.trim() ?? '';
    if (oldTx.adjustmentId) {
      updateData['adjustmentId'] = oldTx.adjustmentId;
    }
    const split = splitUpdateFields(oldTx, input);
    Object.assign(updateData, split.set);
    for (const field of split.clear) {
      updateData[field] = deleteField();
    }
    batch.update(txRef, updateData);

    await batch.commit();
    await this.syncMarker.bump();
  }

  async deleteTransaction(target: string | Transaction): Promise<void> {
    let transactionId: string;
    let monthName: string;
    let category: string;
    let amount: number;
    let adjustmentId: string | undefined;

    // 1. Resolve parameters whether an ID or a full object is passed
    if (typeof target === 'string') {
      transactionId = target;
      const txRef = doc(db, 'transactions', transactionId);
      const txSnap = await getDoc(txRef);

      if (!txSnap.exists()) {
        throw new Error(`Transaction ${transactionId} not found.`);
      }

      const txData = txSnap.data();
      monthName = txData['monthName'] as string;
      category = txData['category'] as string;
      amount = Number(txData['amount']) || 0;
      adjustmentId = (txData['adjustmentId'] as string) ?? undefined;
    } else {
      transactionId = target.id;
      monthName = target.monthName;
      category = target.category;
      amount = target.amount;
      adjustmentId = target.adjustmentId;
    }

    const isTripTransaction = Boolean(adjustmentId); // Determine if this is a trip transaction based on the presence of an adjustmentId
    const batch = writeBatch(db);

    if (!isTripTransaction) {
      // 2. Decrement amount from expenses summary document
      const expensesRef = collection(db, 'expenses');
      const existingSnapshot = await getDocs(
        query(expensesRef, where('MonthName', '==', monthName)),
      );
      const existingExpenseDoc = existingSnapshot.docs[0] ?? null;
      if (existingExpenseDoc) {
        batch.update(existingExpenseDoc.ref, {
          [category]: increment(-amount),
        });
      }
    } else if (adjustmentId) {
      // Remove this transaction's contribution from the linked trip total
      const adjustmentRef = doc(db, 'adjustments', adjustmentId);
      batch.update(adjustmentRef, { amount: increment(-amount) });
    }

    // 3. Delete the transaction document
    const transactionRef = doc(db, 'transactions', transactionId);
    batch.delete(transactionRef);

    await batch.commit();
    await this.syncMarker.bump();
  }

  async fetchAllByAdjustmentId(adjustmentId: string): Promise<Transaction[]> {
    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(
      query(transactionsRef, where('adjustmentId', '==', adjustmentId)),
    );
    const sortedTransactions = snapshot.docs.sort(
      (a, b) => new Date(b.data()['date']).getTime() - new Date(a.data()['date']).getTime(),
    );

    return sortedTransactions.map((d) => {
      const data = d.data();
      const tx: Transaction = {
        id: d.id,
        monthName: data['monthName'] as string,
        date: data['date'] as string,
        description: data['description'] as string,
        category: data['category'] as string,
        subCategoryId: data['subCategoryId'] != null ? Number(data['subCategoryId']) : undefined,
        subCategory: (data['subCategory'] as string | undefined) ?? undefined,
        amount: Number(data['amount']) || 0,
        createdAt: (data['createdAt'] as string) ?? new Date().toISOString(),
        adjustmentId: (data['adjustmentId'] as string) ?? undefined,
      };

      if (data['isSplit']) {
        tx.isSplit = true;
        tx.paidBy = data['paidBy'] as 'me' | number;
        tx.splitBy = (data['splitBy'] as number[]) ?? [];
        tx.splitType = (data['splitType'] as 'split' | 'custom') ?? 'split';
        tx.totalAmount = Number(data['totalAmount']) || 0;
        tx.customSplitAmounts =
          (data['customSplitAmounts'] as Partial<Record<'me' | number, number>> | undefined) ??
          undefined;
        tx.splitPaidPersonIds = (data['splitPaidPersonIds'] as number[]) ?? [];
      }

      return tx;
    });
  }

  async fetchAllTransactionsForExport(): Promise<Transaction[]> {
    const snapshot = await getDocs(collection(db, 'transactions'));

    return snapshot.docs
      .map((document) => this.mapTransaction(document.data(), document.id))
      .sort(compareNewestFirst);
  }

  async fetchAllSplitTransactions(): Promise<Transaction[]> {
    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(query(transactionsRef, where('isSplit', '==', true)));
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        monthName: data['monthName'] as string,
        date: data['date'] as string,
        description: data['description'] as string,
        category: data['category'] as string,
        subCategoryId: data['subCategoryId'] != null ? Number(data['subCategoryId']) : undefined,
        subCategory: (data['subCategory'] as string | undefined) ?? undefined,
        amount: Number(data['amount']) || 0,
        createdAt: data['createdAt'] as string,
        adjustmentId: (data['adjustmentId'] as string) ?? undefined,
        isSplit: true,
        paidBy: data['paidBy'] as 'me' | number,
        splitBy: (data['splitBy'] as number[]) ?? [],
        splitType: (data['splitType'] as 'split' | 'custom') ?? 'split',
        totalAmount: Number(data['totalAmount']) || 0,
        customSplitAmounts:
          (data['customSplitAmounts'] as Partial<Record<'me' | number, number>> | undefined) ??
          undefined,
        splitPaidPersonIds: (data['splitPaidPersonIds'] as number[]) ?? [],
      } satisfies Transaction;
    });
  }

  async updateSplitPaidPersons(transactionId: string, paidPersonIds: number[]): Promise<void> {
    const txRef = doc(db, 'transactions', transactionId);
    await updateDoc(txRef, { splitPaidPersonIds: paidPersonIds });
    await this.syncMarker.bump();
  }
}
