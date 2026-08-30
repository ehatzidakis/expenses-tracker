import { inject, Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PEOPLE, DebtEntry, PersonSummary, PeerBalance } from '../models/splitz.model';
import { Transaction } from '../models/transaction.model';
import { TransactionService } from './transaction-service';

@Injectable({
  providedIn: 'root',
})
export class SplitzService {
  private transactionService = inject(TransactionService);

  getSplitTransactionsQuery() {
    return injectQuery(() => ({
      queryKey: ['splitTransactions'],
      queryFn: (): Promise<Transaction[]> => this.transactionService.fetchAllSplitTransactions(),
    }));
  }

  /** Derives all individual debt entries from enriched split transactions. */
  computeAllDebts(transactions: Transaction[]): DebtEntry[] {
    return transactions.flatMap((tx) => computeSplitDebtEntries(tx));
  }

  computePersonSummaries(transactions: Transaction[]): PersonSummary[] {
    const debts = this.computeAllDebts(transactions);

    return PEOPLE.map((person): PersonSummary => {
      // --- balance with me ---
      let netWithMe = 0;
      let hasUnsettledDebts = false;
      let iOweThisPerson = false;

      for (const d of debts) {
        // Person owes me (person is debtor, I am creditor)
        if (d.debtorId === person.id && d.creditorId === 'me') {
          if (!d.paid) {
            netWithMe += d.amount; // positive = they owe me
            hasUnsettledDebts = true;
          }
        }
        // I owe person (I am debtor, person is creditor)
        if (d.debtorId === 'me' && d.creditorId === person.id) {
          if (!d.paid) {
            netWithMe -= d.amount; // negative = I owe them
            iOweThisPerson = true;
          }
        }
      }

      // --- peer balances (person ↔ other persons, not involving me) ---
      const peerMap = new Map<number, number>(); // otherPersonId → netOwed (positive = person owes other)

      for (const d of debts) {
        if (d.paid) continue;

        // Person is debtor to another person
        if (d.debtorId === person.id && d.creditorId !== 'me' && d.creditorId !== person.id) {
          const otherId = d.creditorId as number;
          peerMap.set(otherId, (peerMap.get(otherId) ?? 0) + d.amount);
          hasUnsettledDebts = true;
        }
        // Person is creditor to another person (other person owes this person)
        // — we show this as a negative net for "other owes person"
        if (d.creditorId === person.id && d.debtorId !== 'me' && d.debtorId !== person.id) {
          // Skip: we show peer debts from the debtor's perspective, not creditor's
        }
      }

      const peerDebts: PeerBalance[] = [];
      for (const [otherId, net] of peerMap.entries()) {
        const other = PEOPLE.find((p) => p.id === otherId);
        if (other && Math.abs(Math.round(net * 100)) > 0) {
          peerDebts.push({ debtor: person, creditor: other, netOwed: Math.round(net * 100) / 100 });
        }
      }

      return {
        person,
        netWithMe: Math.round(netWithMe * 100) / 100,
        peerDebts,
        hasUnsettledDebts,
        iOweThisPerson,
      };
    });
  }

  /**
   * Marks all of Person X's outstanding debts as settled.
   * Covers debts to 'me' and to peer persons.
   */
  async markPersonSettled(personId: number, transactions: Transaction[]): Promise<void> {
    const updates: Promise<void>[] = [];

    for (const tx of transactions) {
      if (!tx.isSplit || !tx.splitBy || tx.paidBy === undefined) continue;

      const paidIds = [...(tx.splitPaidPersonIds ?? [])];
      let changed = false;

      // Person is a debtor (person in splitBy, didn't pay)
      if (tx.splitBy.includes(personId) && tx.paidBy !== personId && !paidIds.includes(personId)) {
        paidIds.push(personId);
        changed = true;
      }

      if (changed) {
        updates.push(this.transactionService.updateSplitPaidPersons(tx.id, paidIds));
      }
    }

    await Promise.all(updates);
  }

  /**
   * Marks 'me' as having paid back Person X.
   * Used when I owe this person (they paid and I split with them).
   */
  async markMePaid(personId: number, transactions: Transaction[]): Promise<void> {
    const ME_ID = 0;
    const updates: Promise<void>[] = [];

    for (const tx of transactions) {
      if (!tx.isSplit || tx.paidBy !== personId) continue;

      const paidIds = [...(tx.splitPaidPersonIds ?? [])];
      if (!paidIds.includes(ME_ID)) {
        paidIds.push(ME_ID);
        updates.push(this.transactionService.updateSplitPaidPersons(tx.id, paidIds));
      }
    }

    await Promise.all(updates);
  }
}

/**
 * Computes split amounts given a total and the list of people sharing the bill.
 * Returns myShare (the amount the app user pays, absorbing any remainder cent)
 * and the per-person base share for storage in the enriched transaction.
 */
export function computeSplit(
  totalAmount: number,
  _paidById: 'me' | number,
  splitWith: number[],
): { myShare: number } {
  const totalPeople = splitWith.length + 1;
  const baseShare = Math.floor((totalAmount / totalPeople) * 100) / 100;
  const myShare = Math.round((totalAmount - baseShare * (totalPeople - 1)) * 100) / 100;
  return { myShare };
}

export function computeSplitDebtEntries(tx: Transaction): DebtEntry[] {
  if (
    !tx.isSplit ||
    tx.paidBy === undefined ||
    tx.totalAmount === undefined ||
    tx.totalAmount === null
  ) {
    return [];
  }

  const paidPersonIds = tx.splitPaidPersonIds ?? [];
  const splitType =
    tx.splitType ??
    (tx.paidBy === 'me' && tx.amount === 0 && (tx.splitBy?.length ?? 0) > 0
      ? 'onlyTheyOwe'
      : 'split');

  if (splitType === 'custom') {
    const entries: DebtEntry[] = [];
    const customAmounts = tx.customSplitAmounts ?? {};
    const participants: Array<'me' | number> = ['me', ...(tx.splitBy ?? [])].filter((person) =>
      Object.prototype.hasOwnProperty.call(customAmounts, person),
    ) as Array<'me' | number>;

    for (const participant of participants) {
      if (participant === tx.paidBy) {
        continue;
      }

      const amount = Number(customAmounts[participant] ?? 0);
      const debtorId = participant;
      const creditorId = tx.paidBy;
      const numericId = participant === 'me' ? 0 : participant;

      entries.push({
        transactionId: tx.id,
        description: tx.description,
        date: tx.date,
        debtorId,
        creditorId,
        amount: Math.round(amount * 100) / 100,
        paid: paidPersonIds.includes(numericId),
      });
    }

    return entries;
  }

  if (splitType === 'onlyTheyOwe') {
    const people = tx.splitBy ?? [];
    if (people.length === 0) {
      return [];
    }

    const share = Math.round((tx.totalAmount / people.length) * 100) / 100;

    return people.map((personId): DebtEntry => ({
      transactionId: tx.id,
      description: tx.description,
      date: tx.date,
      debtorId: personId,
      creditorId: 'me',
      amount: share,
      paid: paidPersonIds.includes(personId),
    }));
  }

  const allParticipants: ('me' | number)[] = ['me', ...(tx.splitBy ?? [])];
  const totalPeople = allParticipants.length;
  const baseShare = Math.floor((tx.totalAmount / totalPeople) * 100) / 100;
  const myShare = Math.round((tx.totalAmount - baseShare * (totalPeople - 1)) * 100) / 100;

  const debts: DebtEntry[] = [];
  for (const participant of allParticipants) {
    if (participant === tx.paidBy) {
      continue;
    }

    const numericId = participant === 'me' ? 0 : participant;
    const share = participant === 'me' ? myShare : baseShare;
    debts.push({
      transactionId: tx.id,
      description: tx.description,
      date: tx.date,
      debtorId: participant,
      creditorId: tx.paidBy,
      amount: share,
      paid: paidPersonIds.includes(numericId),
    });
  }

  return debts;
}
