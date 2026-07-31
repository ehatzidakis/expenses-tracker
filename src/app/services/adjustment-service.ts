import { Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { collection, getDocs, Timestamp } from 'firebase/firestore/lite';
import { Adjustment } from '../models/adjustments.model';
import { db } from '../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AdjustmentService {
  getAdjustmentsQuery() {
    return injectQuery(() => ({
      queryKey: ['adjustments'],
      queryFn: async (): Promise<Adjustment[]> => {
        try {
          // Reference the 'adjustments' collection in your Firestore DB
          const adjustmentsRef = collection(db, 'adjustments');

          // Fetch the snapshot
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
                rawStartDate instanceof Timestamp ? rawStartDate.toDate() : new Date(rawStartDate),
              endDate: rawEndDate instanceof Timestamp ? rawEndDate.toDate() : new Date(rawEndDate),
            } as Adjustment;
          });
        } catch (err) {
          console.error('Firestore Fetch Error:', err);
          throw err;
        }
      },
    }));
  }
}
