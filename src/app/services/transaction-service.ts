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
        return {
          id: doc.id,
          monthName: data['monthName'],
          date: data['date'],
          description: data['description'],
          amount: Number(data['amount']) || 0,
          category: data['category'],
          createdAt: data['createdAt'],
        } as Transaction;
      }),
      lastDoc: docs.length ? docs[docs.length - 1] : null,
      hasMore,
    };
  }

  async createTransaction(input: NewTransactionInput): Promise<string> {
    const monthName = monthNameFromDateString(input.date);
    const createdAt = new Date().toISOString();

    const expensesRef = collection(db, 'expenses');
    const existingSnapshot = await getDocs(query(expensesRef, where('MonthName', '==', monthName)));
    const existingExpenseDoc = existingSnapshot.docs[0] ?? null;

    const batch = writeBatch(db);

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
      batch.set(doc(expensesRef), newExpense);
    }

    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
      monthName,
      date: input.date,
      description: input.description,
      amount: input.amount,
      category: input.category,
      createdAt,
    });

    await batch.commit();

    return transactionRef.id;
  }

  async updateTransaction(oldTx: Transaction, input: NewTransactionInput): Promise<void> {
    const newMonthName = monthNameFromDateString(input.date);
    const batch = writeBatch(db);
    const expensesRef = collection(db, 'expenses');

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

    // 3. Update the transaction document itself
    const txRef = doc(db, 'transactions', oldTx.id);
    batch.update(txRef, {
      date: input.date,
      monthName: newMonthName,
      description: input.description,
      category: input.category,
      amount: input.amount,
    });

    await batch.commit();
  }

  async deleteTransaction(target: string | Transaction): Promise<void> {
    let transactionId: string;
    let monthName: string;
    let category: string;
    let amount: number;

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
    } else {
      transactionId = target.id;
      monthName = target.monthName;
      category = target.category;
      amount = target.amount;
    }

    const batch = writeBatch(db);

    // 2. Decrement amount from expenses summary document
    const expensesRef = collection(db, 'expenses');
    const existingSnapshot = await getDocs(query(expensesRef, where('MonthName', '==', monthName)));
    const existingExpenseDoc = existingSnapshot.docs[0] ?? null;

    if (existingExpenseDoc) {
      batch.update(existingExpenseDoc.ref, {
        [category]: increment(-amount),
      });
    }

    // 3. Delete the transaction document
    const transactionRef = doc(db, 'transactions', transactionId);
    batch.delete(transactionRef);

    await batch.commit();
  }
}
