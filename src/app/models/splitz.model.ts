export interface Person {
  id: number;
  name: string;
}

export const PEOPLE: Person[] = [
  { id: 1, name: 'Stavi' },
  { id: 2, name: 'Alex' },
  { id: 3, name: 'Harry' },
];

/** A single debt derived from an enriched split transaction. */
export interface DebtEntry {
  transactionId: string;
  description: string;
  date: string;
  /** Who owes — 'me' or a person ID. */
  debtorId: 'me' | number;
  /** Who is owed — 'me' or a person ID. */
  creditorId: 'me' | number;
  /** Amount owed (always positive). */
  amount: number;
  /** Whether the debtor has marked this debt as settled. */
  paid: boolean;
}

/** Net balance between two non-me parties. */
export interface PeerBalance {
  debtor: Person;
  creditor: Person;
  /** Net amount the debtor owes the creditor (positive = still owes). */
  netOwed: number;
}

/** Aggregated summary for one person, shown in the Splitzes modal. */
export interface PersonSummary {
  person: Person;
  /**
   * Net balance between me and this person.
   *  positive → they owe me
   *  negative → I owe them
   */
  netWithMe: number;
  /** This person's outstanding debts to other people (not me). */
  peerDebts: PeerBalance[];
  /** True when this person has at least one unpaid debt (to me or peers). */
  hasUnsettledDebts: boolean;
  /** True when I have at least one unpaid debt to this person. */
  iOweThisPerson: boolean;
}
