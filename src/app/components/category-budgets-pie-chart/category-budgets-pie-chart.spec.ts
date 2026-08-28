import { describe, expect, it } from 'vitest';
import { buildPieChartSlices, dimColorForSelection } from './category-budgets-pie-chart.util';

describe('buildPieChartSlices', () => {
  it('sorts slices by percentage descending and ranks saved by its share', () => {
    const slices = buildPieChartSlices(
      {
        Supermarket: 80,
        Food: 40,
        Travel: 20,
        Utilities: 10,
      },
      200,
    );

    expect(slices.map((slice) => slice.name)).toEqual([
      'Supermarket',
      'Saved',
      'Food',
      'Travel',
      'Utilities',
    ]);
    expect(slices.some((slice) => slice.name === 'Saved')).toBe(true);
    expect(slices.find((slice) => slice.name === 'Saved')?.amount).toBe(50);
    expect(slices.find((slice) => slice.name === 'Supermarket')?.percentage).toBeCloseTo(40, 0);
    expect(slices.find((slice) => slice.name === 'Food')?.percentage).toBeCloseTo(20, 0);
    expect(slices.find((slice) => slice.name === 'Travel')?.percentage).toBeCloseTo(10, 0);
  });
});

describe('dimColorForSelection', () => {
  it('keeps the selected slice vivid and dims the rest', () => {
    expect(dimColorForSelection('#34d399', true)).toBe('#34d399');
    expect(dimColorForSelection('#34d399', false)).not.toBe('#34d399');
  });
});
