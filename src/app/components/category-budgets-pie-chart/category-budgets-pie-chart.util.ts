import { getCategoryMeta } from '../../services/expense-state.service';

export interface PieChartSlice {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export const CATEGORY_PIE_COLORS: Record<string, string> = {
  // Warm/cool alternation in slice order, no yellow. Validated on the dark panel (#1c1511):
  // adjacent pairs pass CVD (worst ΔE 10.8) and the normal-vision floor (worst 19.0).
  Saved: '#7f9a4a',
  Supermarket: '#5c86c4',
  Medical: '#d9655c',
  Personal: '#8a6fd1',
  EatingOut: '#b8682e',
  Utilities: '#3d9ed6',
  Takeaway: '#c4566e',
  Tickets: '#6a62b8',
  Gaming: '#8c9a3a',
  Cats: '#a0619e',
  Travel: '#5aa04a',
  Subscriptions: '#b55a8c',
  Gym: '#3a74d0',
  'Plane Tickets': '#5c86c4',
  Accommodation: '#d9655c',
  Food: '#8a6fd1',
  Transportation: '#b8682e',
  Gifts: '#3d9ed6',
  Activities: '#c4566e',
  Attractions: '#6a62b8',
  Splurge: '#8c9a3a',
  Miscellaneous: '#a0619e',
};

export function dimColorForSelection(color: string, isSelected: boolean): string {
  if (isSelected) return color;

  if (!color.startsWith('#') || color.length !== 7) {
    return color;
  }

  const hex = color.slice(1);
  const num = Number.parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const dim = (value: number) => Math.round(value * 0.35);
  return `rgb(${dim(r)}, ${dim(g)}, ${dim(b)})`;
}

export function buildPieChartSlices(
  expenseValues: Record<string, number | string> | null | undefined,
  wage: number,
): PieChartSlice[] {
  if (!expenseValues) return [];

  const categoryEntries = Object.entries(expenseValues)
    .filter(([key]) => !['id', 'MonthName', 'TotalWage'].includes(key))
    .map(([name, value]) => ({
      name,
      amount: Number(value) || 0,
    }))
    .filter((entry) => entry.amount > 0);

  const totalSpend = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const saved = Math.max(0, wage - totalSpend);
  const total = totalSpend + saved;

  if (total <= 0) return [];

  const slices = categoryEntries.map(({ name, amount }) => {
    const meta = getCategoryMeta(name);
    const color = CATEGORY_PIE_COLORS[name] ?? (meta.emoji ? '#60a5fa' : '#94a3b8');

    return {
      name,
      amount,
      percentage: (amount / total) * 100,
      color,
    };
  });

  const savedSlice =
    saved > 0
      ? [
          {
            name: 'Saved',
            amount: saved,
            percentage: (saved / total) * 100,
            color: CATEGORY_PIE_COLORS['Saved'],
          },
        ]
      : [];

  return [...savedSlice, ...slices].sort(
    (a, b) => b.percentage - a.percentage || b.amount - a.amount,
  );
}
