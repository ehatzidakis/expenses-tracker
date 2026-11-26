import { SplitzParticipant, SplitzSettlementRecord } from '../../models/splitz.model';
import { Transaction } from '../../models/transaction.model';

/** One settled debt, with details from its transaction when that still exists. */
export interface SettlementRow extends SplitzSettlementRecord {
  category?: string;
  transactionTotalAmount?: number;
}

/** Everything one "Settle up" recorded. */
export interface SettlementGroup {
  id: string;
  settledAt: string;
  /** The other person in the settle-up (the side that isn't me). */
  counterpartId: SplitzParticipant;
  /** Newest transaction first. */
  rows: SettlementRow[];
  /** What the counterpart owed me across the group. */
  owedToMe: number;
  /** What I owed the counterpart across the group. */
  iOwed: number;
  /** owedToMe − iOwed. Positive: they paid me; negative: I paid them. */
  net: number;
  total: number;
  note?: string;
  /** Oldest and newest dated transactions in the group. */
  first?: SettlementRow;
  last?: SettlementRow;
}

const round = (value: number) => Math.round(value * 100) / 100;

function counterpartOf(record: SplitzSettlementRecord): SplitzParticipant {
  if (record.debtorId === 'me') return record.creditorId;
  return record.debtorId;
}

/**
 * Groups settlement records by the settle-up that wrote them. Every record from
 * one settle-up shares the same createdAt, so that plus the counterpart is the key.
 */
export function groupSettlements(
  records: readonly SplitzSettlementRecord[],
  transactions: readonly Transaction[] = [],
): SettlementGroup[] {
  const txById = new Map(transactions.map((tx) => [tx.id, tx]));
  const groups = new Map<string, SettlementGroup>();

  for (const record of records) {
    const counterpartId = counterpartOf(record);
    const key = `${record.createdAt}|${counterpartId}`;
    const tx = record.transactionId ? txById.get(record.transactionId) : undefined;
    const row: SettlementRow = {
      ...record,
      category: tx?.category,
      transactionTotalAmount: tx?.totalAmount,
    };

    let group = groups.get(key);
    if (!group) {
      group = {
        id: key,
        settledAt: record.settledAt ?? record.createdAt,
        counterpartId,
        rows: [],
        owedToMe: 0,
        iOwed: 0,
        net: 0,
        total: 0,
        note: record.note,
      };
      groups.set(key, group);
    }

    group.rows.push(row);
    group.total += record.amount;
    if (record.creditorId === 'me') group.owedToMe += record.amount;
    if (record.debtorId === 'me') group.iOwed += record.amount;
    if (!group.note && record.note) group.note = record.note;
  }

  for (const group of groups.values()) {
    group.owedToMe = round(group.owedToMe);
    group.iOwed = round(group.iOwed);
    group.net = round(group.owedToMe - group.iOwed);
    group.total = round(group.total);
    group.rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const dated = group.rows.filter((row) => row.date);
    group.last = dated[0];
    group.first = dated[dated.length - 1];
  }

  return [...groups.values()].sort((a, b) => b.settledAt.localeCompare(a.settledAt));
}
