import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  increment,
  limit,
  orderBy,
  query,
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
import { CATEGORY_NAMES, DEFAULT_TOTAL_WAGE } from './expense-state.service';

export interface TransactionPage {
  items: Transaction[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface NewTransactionInput {
  date: string; // 'YYYY-MM-DD'
  description: string;
  category: string;
  amount: number;
  adjustmentId?: string; // Optional: ID of the associated adjustment, if any
  // Optional split metadata
  isSplit?: boolean;
  paidBy?: 'me' | number;
  splitBy?: number[];
  splitType?: 'split' | 'onlyMeOwes' | 'onlyTheyOwe';
  totalAmount?: number;
}

const PAGE_SIZE = 10;

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
  async fetchPage(
    monthName: string,
    category: string,
    cursor: QueryDocumentSnapshot<DocumentData> | null,
  ): Promise<TransactionPage> {
    const transactionsRef = collection(db, 'transactions');
    const constraints: QueryConstraint[] = [
      where('monthName', '==', monthName),
      where('category', '==', category),
      orderBy('date', 'desc'),
      // Fetch one extra doc so we know whether a next page exists without a separate count query
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
          createdAt: data['createdAt'],
          adjustmentId: data['adjustmentId'] ?? undefined,
        };
        if (data['isSplit']) {
          tx.isSplit = true;
          tx.paidBy = data['paidBy'] as 'me' | number;
          tx.splitBy = (data['splitBy'] as number[]) ?? [];
          tx.splitType = (data['splitType'] as 'split' | 'onlyMeOwes' | 'onlyTheyOwe') ?? 'split';
          tx.totalAmount = Number(data['totalAmount']) || 0;
          tx.splitPaidPersonIds = (data['splitPaidPersonIds'] as number[]) ?? [];
        }
        return tx;
      }),
      lastDoc: docs.length ? docs[docs.length - 1] : null,
      hasMore,
    };
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
          TotalWage: DEFAULT_TOTAL_WAGE,
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
    if (input.adjustmentId) {
      txData['adjustmentId'] = input.adjustmentId;
    }
    if (input.isSplit) {
      txData['isSplit'] = true;
      txData['paidBy'] = input.paidBy;
      txData['splitBy'] = input.splitBy ?? [];
      txData['splitType'] = input.splitType ?? 'split';
      txData['totalAmount'] = input.totalAmount ?? input.amount;
      txData['splitPaidPersonIds'] = [];
    }
    batch.set(transactionRef, txData);

    await batch.commit();

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
          TotalWage: DEFAULT_TOTAL_WAGE,
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
    if (oldTx.adjustmentId) {
      updateData['adjustmentId'] = oldTx.adjustmentId;
    }
    if (oldTx.isSplit) {
      const participants = (oldTx.splitBy?.length ?? 0) + 1;
      updateData['totalAmount'] = Math.round(input.amount * participants * 100) / 100; // Round to 2 decimal places
    }
    batch.update(txRef, updateData);

    await batch.commit();
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
      return {
        id: d.id,
        monthName: data['monthName'] as string,
        date: data['date'] as string,
        description: data['description'] as string,
        category: data['category'] as string,
        amount: Number(data['amount']) || 0,
        adjustmentId: (data['adjustmentId'] as string) ?? undefined,
      } as Transaction;
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
        amount: Number(data['amount']) || 0,
        createdAt: data['createdAt'] as string,
        adjustmentId: (data['adjustmentId'] as string) ?? undefined,
        isSplit: true,
        paidBy: data['paidBy'] as 'me' | number,
        splitBy: (data['splitBy'] as number[]) ?? [],
        splitType: (data['splitType'] as 'split' | 'onlyMeOwes' | 'onlyTheyOwe') ?? 'split',
        totalAmount: Number(data['totalAmount']) || 0,
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
        amount: Number(data['amount']) || 0,
        createdAt: data['createdAt'] as string,
        adjustmentId: (data['adjustmentId'] as string) ?? undefined,
      };

      // Only apply split properties if the transaction actually is a split
      if (data['isSplit']) {
        tx.isSplit = true;
        tx.paidBy = data['paidBy'] as 'me' | number;
        tx.splitBy = (data['splitBy'] as number[]) ?? [];
        tx.splitType = (data['splitType'] as 'split' | 'onlyMeOwes' | 'onlyTheyOwe') ?? 'split';
        tx.totalAmount = Number(data['totalAmount']) || 0;
        tx.splitPaidPersonIds = (data['splitPaidPersonIds'] as number[]) ?? [];
      }

      return tx;
    });
  }

  async updateSplitPaidPersons(transactionId: string, paidPersonIds: number[]): Promise<void> {
    const txRef = doc(db, 'transactions', transactionId);
    await updateDoc(txRef, { splitPaidPersonIds: paidPersonIds });
  }
}
