import { Injectable, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import {
  collection,
  getDocs,
  setDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore/lite';
import { Adjustment } from '../models/adjustments.model';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';

export interface NewAdjustmentInput {
  description: string;
  amount: number;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  isAddition: boolean; // true for addition, false for deduction
  isTrip?: boolean; // Optional: true if it's a trip-related adjustment
  isSelectable?: boolean; // Optional: true if the adjustment can be selected
}

@Injectable({
  providedIn: 'root',
})
export class AdjustmentService {
  private readonly authService = inject(AuthService);

  getAdjustmentsQuery() {
    return injectQuery(() => {
      const uid = this.authService.user()?.uid ?? null;

      return {
        queryKey: ['adjustments', uid],
        enabled: !!uid,
        queryFn: async (): Promise<Adjustment[]> => {
          try {
            // Reference the 'adjustments' collection in your Firestore DB
            const adjustmentsRef = collection(db, 'adjustments');
            const snapshot = await getDocs(adjustmentsRef);

            // Map the Firestore documents into your Adjustment interface
            return snapshot.docs.map((doc) => {
              const data = doc.data();
              const rawStartDate = data['startDate'];
              const rawEndDate = data['endDate'];

              return {
                id: doc.id, // Firestore's auto-generated ID
                title: data['title'],
                adjType: Boolean(data['adjType']),
                amount: Number(data['amount']) || 0,
                startDate:
                  rawStartDate instanceof Timestamp
                    ? rawStartDate.toDate()
                    : new Date(rawStartDate),
                endDate:
                  rawEndDate instanceof Timestamp ? rawEndDate.toDate() : new Date(rawEndDate),
                isTrip: Boolean(data['isTrip']),
                isSelectable: Boolean(data['isSelectable']),
              } as Adjustment;
            });
          } catch (err) {
            console.error('Firestore Fetch Error:', err);
            throw err;
          }
        },
      };
    });
  }

  async createAdjustment(input: NewAdjustmentInput): Promise<string> {
    const adjustmentRef = doc(collection(db, 'adjustments'));

    await setDoc(adjustmentRef, {
      title: input.description,
      adjType: input.isAddition,
      amount: input.amount,
      startDate: input.startDate,
      endDate: input.endDate,
      isTrip: input.isTrip ?? false,
      isSelectable: input.isSelectable ?? false,
    });
    return adjustmentRef.id;
  }

  async updateAdjustment(id: string, input: NewAdjustmentInput): Promise<void> {
    const adjRef = doc(db, 'adjustments', id);

    await updateDoc(adjRef, {
      title: input.description,
      adjType: input.isAddition,
      amount: input.amount,
      startDate: input.startDate,
      endDate: input.endDate,
      isTrip: input.isTrip ?? false,
      isSelectable: input.isSelectable ?? false,
    });
  }

  async deleteAdjustment(target: string | Adjustment): Promise<void> {
    const adjId = typeof target === 'string' ? target : target.id;
    const adjRef = doc(db, 'adjustments', adjId);
    await deleteDoc(adjRef);
  }
}
