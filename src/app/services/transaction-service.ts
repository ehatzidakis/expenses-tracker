import { inject, Injectable, signal } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import { Transaction } from '../models/transaction.model';
import { db } from '../firebase.config';
import { CATEGORY_NAMES } from './expense-state.service';
import { AuthService } from './auth.service';
import { BudgetSettingsService } from './budget-settings.service';

export interface TransactionPage {
  items: Transaction[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

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
  sourceRole: 'kiosk';
  status: 'pending';
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

  readonly transactionRevision = signal(0);

  private notifyTransactionChanged(): void {
    this.transactionRevision.update((revision) => revision + 1);
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

  async countTransactions(monthName: string, category: string): Promise<number> {
    if (!monthName || !category) {
      return 0;
    }

    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(
      query(
        transactionsRef,
        where('monthName', '==', monthName),
        where('category', '==', category),
      ),
    );

    return snapshot.size;
  }

  async countTransactionsByCategory(
    monthName: string,
    categories: string[],
  ): Promise<Record<string, number>> {
    const counts = Object.fromEntries(categories.map((category) => [category, 0]));

    if (!monthName || categories.length === 0) {
      return counts;
    }

    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(query(transactionsRef, where('monthName', '==', monthName)));
    const categorySet = new Set(categories);

    for (const transaction of snapshot.docs) {
      const category = transaction.data()['category'];
      if (typeof category === 'string' && categorySet.has(category)) {
        counts[category] += 1;
      }
    }

    return counts;
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

  async fetchPendingTransactions(): Promise<PendingTransaction[]> {
    const snapshot = await getDocs(collection(db, 'adjustments-temp'));

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
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
        sourceRole: (data['sourceRole'] as 'kiosk') ?? 'kiosk',
        status: (data['status'] as 'pending') ?? 'pending',
      };

      return normalizePendingSplitOverride(base) as PendingTransaction;
    });
  }

  async createPendingTransaction(input: NewTransactionInput): Promise<string> {
    const currentUser = this.authService.user();
    if (!currentUser?.uid) {
      throw new Error('Kiosk user is not authenticated. Please sign in again.');
    }

    const pendingRef = doc(collection(db, 'adjustments-temp'));
    const pendingData = stripUndefinedFields({
      ...input,
      isSplit: false,
      splitBy: [],
      totalAmount: input.amount,
      createdAt: new Date().toISOString(),
      createdByUid: currentUser.uid,
      sourceRole: 'kiosk' as const,
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
    const pendingRef = doc(db, 'adjustments-temp', id);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
      return;
    }

    const data = pendingSnap.data();
    const resolvedInput = normalizePendingSplitOverride({
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
    });

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

    this.notifyTransactionChanged();

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
    const updateData: Record<string, string | number> = {
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
    if (oldTx.isSplit) {
      const participants = (oldTx.splitBy?.length ?? 0) + 1;
      updateData['totalAmount'] = Math.round(input.amount * participants * 100) / 100; // Round to 2 decimal places
    }
    batch.update(txRef, updateData);

    await batch.commit();

    this.notifyTransactionChanged();
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

    this.notifyTransactionChanged();
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

  async fetchAllUtilityTransactions(): Promise<Transaction[]> {
    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(query(transactionsRef, where('category', '==', 'Utilities')));

    return snapshot.docs.map((d) => {
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
        createdAt: data['createdAt'] as string,
        adjustmentId: (data['adjustmentId'] as string) ?? undefined,
      };

      // Only apply split properties if the transaction actually is a split
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

  async fetchTransactionsByCategories(categories: string[]): Promise<Transaction[]> {
    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(query(transactionsRef, where('category', 'in', categories)));

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
      } as Transaction;
    });
  }

  async updateSplitPaidPersons(transactionId: string, paidPersonIds: number[]): Promise<void> {
    const txRef = doc(db, 'transactions', transactionId);
    await updateDoc(txRef, { splitPaidPersonIds: paidPersonIds });
  }
}
