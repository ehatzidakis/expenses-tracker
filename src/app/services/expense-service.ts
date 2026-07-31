import { Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { addDoc, collection, getDocs } from 'firebase/firestore/lite';
import { Expense } from '../models/expenses.model';
import { db } from '../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  getExpensesQuery() {
    return injectQuery(() => ({
      queryKey: ['expenses'],
      queryFn: async (): Promise<Expense[]> => {
        try {
          // Reference the 'expenses' collection in your Firestore DB
          const expensesRef = collection(db, 'expenses');

          // Fetch the snapshot
          const snapshot = await getDocs(expensesRef);

          // Map the Firestore documents into your Expense interface
          return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id, // Firestore's auto-generated ID
              MonthName: data['MonthName'],
              TotalWage: Number(data['TotalWage']) || 0, // Ensure it's a number
              Supermarket: Number(data['Supermarket']) || 0,
              Medical: Number(data['Medical']) || 0,
              Personal: Number(data['Personal']) || 0,
              EatingOut: Number(data['EatingOut']) || 0,
              Utilities: Number(data['Utilities']) || 0,
              Takeaway: Number(data['Takeaway']) || 0,
              Tickets: Number(data['Tickets']) || 0,
              Gaming: Number(data['Gaming']) || 0,
              Cats: Number(data['Cats']) || 0,
              Travel: Number(data['Travel']) || 0,
              Subscriptions: Number(data['Subscriptions']) || 0,
              Gym: Number(data['Gym']) || 0,
            } as Expense;
          });
        } catch (err) {
          console.error('Firestore Fetch Error:', err);
          throw err;
        }
      },
    }));
  }
}
