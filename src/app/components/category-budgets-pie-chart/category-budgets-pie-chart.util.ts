import { getCategoryMeta } from '../../services/expense-state.service';

export interface PieChartSlice {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export const CATEGORY_PIE_COLORS: Record<string, string> = {
  Saved: '#8b5cf6',
  Supermarket: '#34d399',
  Medical: '#fb7185',
  Personal: '#a78bfa',
  EatingOut: '#fbbf24',
  Utilities: '#facc15',
  Takeaway: '#fb923c',
  Tickets: '#38bdf8',
  Gaming: '#22d3ee',
  Cats: '#f472b6',
  Travel: '#818cf8',
  Subscriptions: '#d946ef',
  Gym: '#2dd4bf',
  'Plane Tickets': '#38bdf8',
  Accommodation: '#a78bfa',
  Food: '#fbbf24',
  Transportation: '#818cf8',
  Gifts: '#f472b6',
  Activities: '#2dd4bf',
  Attractions: '#facc15',
  Splurge: '#c084fc',
  Miscellaneous: '#94a3b8',
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
