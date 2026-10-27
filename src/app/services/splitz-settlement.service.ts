import { Injectable, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore/lite';
import { AuthService } from './auth.service';
import { db } from '../firebase.config';
import { DebtEntry, SplitzParticipant, SplitzSettlementRecord } from '../models/splitz.model';

@Injectable({ providedIn: 'root' })
export class SplitzSettlementService {
  private readonly authService = inject(AuthService);

  getHistoryQuery() {
    return injectQuery(() => {
      const uid = this.authService.user()?.uid ?? null;
      return {
        queryKey: ['splitzSettlementHistory', uid],
        enabled: !!uid,
        queryFn: () => this.fetchHistory(),
      };
    });
  }

  async fetchHistory(): Promise<SplitzSettlementRecord[]> {
    const uid = this.requireUid();
    const snapshot = await getDocs(
      query(collection(db, 'splitzSettlements'), where('createdByUid', '==', uid)),
    );

    return snapshot.docs
      .map((item) => item.data() as SplitzSettlementRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async recordSettlements(debts: DebtEntry[], note?: string): Promise<void> {
    const uid = this.requireUid();
    const createdAt = new Date().toISOString();
    await Promise.all(
      debts.map((debt) => {
        const id = this.recordId('settlement', debt);
        const record: SplitzSettlementRecord = {
          id,
          recordType: 'settlement',
          transactionId: debt.transactionId,
          description: debt.description,
          date: debt.date,
          debtorId: debt.debtorId,
          creditorId: debt.creditorId,
          amount: debt.amount,
          note: note?.trim() || undefined,
          settledAt: createdAt,
          createdAt,
          createdByUid: uid,
        };
        return setDoc(doc(db, 'splitzSettlements', id), record, { merge: true });
      }),
    );
  }

  private recordId(type: 'settlement', debt: DebtEntry): string {
    return [
      type,
      debt.transactionId,
      this.participantKey(debt.debtorId),
      this.participantKey(debt.creditorId),
    ]
      .join('-')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private participantKey(participant: SplitzParticipant): string {
    return participant === 'me' ? 'me' : String(participant);
  }

  private requireUid(): string {
    const uid = this.authService.user()?.uid;
    if (!uid) throw new Error('You must be signed in to manage Splitzes history.');
    return uid;
  }
}
