export interface Person {
  id: number;
  name: string;
}

export const PEOPLE: Person[] = [
  { id: 1, name: 'Stavi' },
  { id: 2, name: 'Alex' },
  { id: 3, name: 'Harry' },
];

/** One balance entry recorded against a person for a single split event. */
export interface PersonOwedEntry {
  /** Reference ID matching the SplitzRecord this entry came from. */
  id: string;
  /**
   * Amount from MY perspective:
   *  positive → I owe this person
   *  negative → this person owes me
   */
  amount: number;
}

/** Aggregated summary computed from all split records for one person. */
export interface PersonSummary {
  person: Person;
  /** Sum of absolute amounts across all splits involving this person. */
  totalSplitAmount: number;
  /** Net balance: positive = I owe them, negative = they owe me. */
  netOwed: number;
  /** Individual per-split entries. */
  personOwed: PersonOwedEntry[];
}

/** A single split-transaction record stored in Firebase. */
export interface SplitzRecord {
  id: string;
  date: string;
  description: string;
  /** The full, original transaction amount before splitting. */
  totalAmount: number;
  /** 'me' or a person ID from PEOPLE. */
  paidById: 'me' | number;
  /** IDs of people (from PEOPLE) involved in the split (excluding me). */
  splitWith: number[];
  /** The share that was saved to my own transaction. */
  myShare: number;
  /** Per-person balance delta recorded for this split. */
  personAmounts: PersonAmountEntry[];
  createdAt: string;
}

export interface PersonAmountEntry {
  personId: number;
  /**
   * From MY perspective:
   *  positive → I owe this person (they paid, I owe my share)
   *  negative → they owe me (I paid, they owe their share)
   */
  amount: number;
}
