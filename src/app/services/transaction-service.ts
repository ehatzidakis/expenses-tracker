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

  async deleteTransaction(transactionId: string): Promise<void> {
    const transactionRef = doc(db, 'transactions', transactionId);
    const txSnap = await getDoc(transactionRef);

    if (!txSnap.exists()) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    const txData = txSnap.data();
    const monthName = txData['monthName'] as string;
    const category = txData['category'] as string;
    const amount = Number(txData['amount']) || 0;

    const batch = writeBatch(db);

    // 1. Decrement summary document in expenses collection
    const expensesRef = collection(db, 'expenses');
    const existingSnapshot = await getDocs(query(expensesRef, where('MonthName', '==', monthName)));
    const existingExpenseDoc = existingSnapshot.docs[0] ?? null;

    if (existingExpenseDoc) {
      batch.update(existingExpenseDoc.ref, {
        [category]: increment(-amount),
      });
    }

    // 2. Remove transaction document
    batch.delete(transactionRef);

    await batch.commit();
  }
}
