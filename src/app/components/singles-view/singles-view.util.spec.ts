import type { Adjustment } from '../../models/adjustments.model';
import { filterSingles, singleYears, singlesTotals } from './singles-view.util';

function adj(id: string, adjType: boolean, amount: number, start: string): Adjustment {
  return { id, title: id, adjType, amount, startDate: new Date(start), endDate: new Date(start) };
}

const LIST: Adjustment[] = [
  adj('bonus26', true, 800, '2026-06-10'),
  adj('car26', false, 320, '2026-03-02'),
  adj('tax25', true, 150, '2025-07-01'),
  adj('tv25', false, 600, '2025-01-15'),
  adj('sofa24', false, 900, '2024-11-20'),
];

const ids = (list: Adjustment[]) => list.map((a) => a.id);

describe('singles-view util', () => {
  it('lists distinct years newest first', () => {
    expect(singleYears(LIST)).toEqual([2026, 2025, 2024]);
    expect(singleYears([])).toEqual([]);
  });

  it('returns everything when no filter is set', () => {
    expect(ids(filterSingles(LIST, null, null))).toEqual(ids(LIST));
  });

  it('filters by type only', () => {
    expect(ids(filterSingles(LIST, 'addition', null))).toEqual(['bonus26', 'tax25']);
    expect(ids(filterSingles(LIST, 'subtraction', null))).toEqual(['car26', 'tv25', 'sofa24']);
  });

  it('filters by year only', () => {
    expect(ids(filterSingles(LIST, null, 2025))).toEqual(['tax25', 'tv25']);
    expect(filterSingles(LIST, null, 2020)).toEqual([]);
  });

  it('combines type and year', () => {
    expect(ids(filterSingles(LIST, 'subtraction', 2025))).toEqual(['tv25']);
    expect(filterSingles(LIST, 'addition', 2024)).toEqual([]);
  });

  it('totals incoming, outgoing and net', () => {
    expect(singlesTotals(LIST)).toEqual({
      count: 5,
      incoming: 950,
      outgoing: 1820,
      net: -870,
    });
    expect(singlesTotals([])).toEqual({ count: 0, incoming: 0, outgoing: 0, net: 0 });
  });
});
