import type { Adjustment } from '../../models/adjustments.model';

export type SinglesType = 'addition' | 'subtraction';

export interface SinglesTotals {
  count: number;
  incoming: number;
  outgoing: number;
  net: number;
}

/** Distinct start-date years, newest first. */
export function singleYears(list: Adjustment[]): number[] {
  return [...new Set(list.map((a) => a.startDate.getFullYear()))].sort((a, b) => b - a);
}

/** A null type or year means "don't filter on it". */
export function filterSingles(
  list: Adjustment[],
  type: SinglesType | null,
  year: number | null,
): Adjustment[] {
  return list.filter((a) => {
    if (type === 'addition' && !a.adjType) return false;
    if (type === 'subtraction' && a.adjType) return false;
    if (year !== null && a.startDate.getFullYear() !== year) return false;
    return true;
  });
}

export function singlesTotals(list: Adjustment[]): SinglesTotals {
  let incoming = 0;
  let outgoing = 0;
  for (const a of list) {
    if (a.adjType) incoming += a.amount;
    else outgoing += a.amount;
  }
  return { count: list.length, incoming, outgoing, net: incoming - outgoing };
}
