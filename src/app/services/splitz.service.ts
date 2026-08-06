import { Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore/lite';
import { db } from '../firebase.config';
import {
  PEOPLE,
  PersonAmountEntry,
  PersonOwedEntry,
  PersonSummary,
  SplitzRecord,
} from '../models/splitz.model';

export interface NewSplitzInput {
  date: string;
  description: string;
  totalAmount: number;
  paidById: 'me' | number;
  splitWith: number[];
  myShare: number;
  personAmounts: PersonAmountEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class SplitzService {
  getSplitzesQuery() {
    return injectQuery(() => ({
      queryKey: ['splitzes'],
      queryFn: async (): Promise<SplitzRecord[]> => {
        const ref = collection(db, 'splitzes');
        const snapshot = await getDocs(ref);
        return snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            date: data['date'] as string,
            description: data['description'] as string,
            totalAmount: Number(data['totalAmount']) || 0,
            paidById: data['paidById'] as 'me' | number,
            splitWith: (data['splitWith'] as number[]) ?? [],
            myShare: Number(data['myShare']) || 0,
            personAmounts: (data['personAmounts'] as PersonAmountEntry[]) ?? [],
            createdAt: data['createdAt'] as string,
          } satisfies SplitzRecord;
        });
      },
    }));
  }

  async createSplitzRecord(input: NewSplitzInput): Promise<string> {
    const ref = doc(collection(db, 'splitzes'));
    await setDoc(ref, {
      date: input.date,
      description: input.description,
      totalAmount: input.totalAmount,
      paidById: input.paidById,
      splitWith: input.splitWith,
      myShare: input.myShare,
      personAmounts: input.personAmounts,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }

  computePersonSummaries(records: SplitzRecord[]): PersonSummary[] {
    return PEOPLE.map((person) => {
      const personOwed: PersonOwedEntry[] = [];
      let totalSplitAmount = 0;

      for (const record of records) {
        if (!record.splitWith.includes(person.id)) continue;

        const entry = record.personAmounts.find((e) => e.personId === person.id);
        if (!entry) continue;

        personOwed.push({ id: record.id, amount: entry.amount });
        totalSplitAmount += Math.abs(entry.amount);
      }

      const netOwed = personOwed.reduce((sum, e) => sum + e.amount, 0);

      return {
        person,
        totalSplitAmount: Math.round(totalSplitAmount * 100) / 100,
        netOwed: Math.round(netOwed * 100) / 100,
        personOwed,
      } satisfies PersonSummary;
    });
  }
}

/**
 * Computes split amounts given a total and the list of people sharing the bill.
 * Returns myShare (the amount the app user pays, absorbing any remainder cent)
 * and the personAmounts array for the split record.
 */
export function computeSplit(
  totalAmount: number,
  paidById: 'me' | number,
  splitWith: number[],
): { myShare: number; personAmounts: PersonAmountEntry[] } {
  const totalPeople = splitWith.length + 1;
  const baseShare = Math.floor((totalAmount / totalPeople) * 100) / 100;
  const myShare = Math.round((totalAmount - baseShare * (totalPeople - 1)) * 100) / 100;

  const personAmounts: PersonAmountEntry[] = splitWith.map((personId) => {
    if (paidById === 'me') {
      // I paid → each person owes me their base share
      return { personId, amount: -baseShare };
    } else if (paidById === personId) {
      // This person paid → I owe them my share
      return { personId, amount: myShare };
    } else {
      // Another person paid; my balance with this person is unaffected
      return { personId, amount: 0 };
    }
  });

  return { myShare, personAmounts };
}
