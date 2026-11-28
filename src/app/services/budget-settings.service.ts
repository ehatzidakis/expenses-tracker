import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';
import { CATEGORY_BUDGETS, DEFAULT_TOTAL_WAGE } from './expense-state.service';
import {
  BudgetPeriod,
  monthKey,
  monthKeyOf,
  periodFor,
  withSavedPeriod,
} from '../utils/budget-history';

export interface BudgetSettings {
  /** Today's budgets: a copy of the latest period once there is a history. */
  categoryBudgets: Record<string, number>;
  /** Today's wage: a copy of the latest period's once there is a history. */
  defaultTotalWage: number;
  /** Every budget set and the month it started, oldest first. Empty before the history was seeded. */
  budgetHistory: BudgetPeriod[];
}

function normalizeCategoryBudgets(value?: Record<string, unknown> | null): Record<string, number> {
  const categoryBudgets = {
    ...CATEGORY_BUDGETS,
    ...(value ?? {}),
  };

  return Object.fromEntries(
    Object.entries(categoryBudgets).map(([category, budget]) => [
      category,
      Number(budget ?? CATEGORY_BUDGETS[category] ?? 0) || 0,
    ]),
  );
}

function normalizeWage(value: unknown): number {
  return Number(value ?? DEFAULT_TOTAL_WAGE) || DEFAULT_TOTAL_WAGE;
}

function normalizeHistory(value: unknown): BudgetPeriod[] {
  if (!Array.isArray(value)) return [];
  const byMonth = new Map<string, BudgetPeriod>();
  for (const entry of value as Partial<BudgetPeriod>[]) {
    if (typeof entry?.from !== 'string' || !/^\d{4}-\d{2}$/.test(entry.from)) continue;
    byMonth.set(entry.from, {
      from: entry.from,
      categoryBudgets: normalizeCategoryBudgets(entry.categoryBudgets),
      wage: normalizeWage(entry.wage),
    });
  }
  return [...byMonth.values()].sort((a, b) => a.from.localeCompare(b.from));
}

export function normalizeBudgetSettings(value?: Partial<BudgetSettings> | null): BudgetSettings {
  const budgetHistory = normalizeHistory(value?.budgetHistory);
  const latest = budgetHistory[budgetHistory.length - 1];

  return {
    categoryBudgets: latest
      ? { ...latest.categoryBudgets }
      : normalizeCategoryBudgets(value?.categoryBudgets),
    defaultTotalWage: latest ? latest.wage : normalizeWage(value?.defaultTotalWage),
    budgetHistory,
  };
}

@Injectable({
  providedIn: 'root',
})
export class BudgetSettingsService {
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly settings = signal<BudgetSettings>(normalizeBudgetSettings());
  readonly history = computed(() => this.settings().budgetHistory);

  constructor() {
    effect(() => {
      const uid = this.authService.user()?.uid;
      if (uid) {
        void this.loadSettings();
      }
    });
  }

  private getUserSettingsRef() {
    const uid = this.authService.user()?.uid;
    if (!uid) {
      return null;
    }

    return doc(db, 'users', uid);
  }

  /**
   * A category's budget in a month ('March 2025'), from the period that month falls in.
   * Without a month, or one that can't be read, today's budget.
   */
  getCategoryBudget(category: string, monthName?: string): number | null {
    const settings = this.settings();
    const period = periodFor(settings.budgetHistory, monthName ? monthKey(monthName) : null);
    const value = (period?.categoryBudgets ?? settings.categoryBudgets)[category];
    return value == null ? null : Number(value) || 0;
  }

  getDefaultTotalWage(): number {
    return Number(this.settings().defaultTotalWage) || DEFAULT_TOTAL_WAGE;
  }

  async loadSettings(): Promise<BudgetSettings> {
    const uid = this.authService.user()?.uid;
    if (!uid) {
      const fallback = normalizeBudgetSettings();
      this.settings.set(fallback);
      return fallback;
    }

    const profileRef = this.getUserSettingsRef();
    if (!profileRef) {
      const fallback = normalizeBudgetSettings();
      this.settings.set(fallback);
      return fallback;
    }

    const snapshot = await getDoc(profileRef);
    const settings = snapshot.data()?.['settings'];
    const normalized = normalizeBudgetSettings(
      settings as Partial<BudgetSettings> | null | undefined,
    );
    this.settings.set(normalized);
    return normalized;
  }

  /** Saves new budgets and wage for this month onward; earlier months keep the budgets they had. */
  async saveSettings(
    settings: Pick<Partial<BudgetSettings>, 'categoryBudgets' | 'defaultTotalWage'>,
    now: Date = new Date(),
  ): Promise<BudgetSettings> {
    const profileRef = this.getUserSettingsRef();
    const values = normalizeBudgetSettings(settings);
    const budgetHistory = withSavedPeriod(this.settings().budgetHistory, {
      from: monthKeyOf(now),
      categoryBudgets: values.categoryBudgets,
      wage: values.defaultTotalWage,
    });
    const normalized = normalizeBudgetSettings({ budgetHistory });
    this.settings.set(normalized);

    if (!profileRef) {
      return normalized;
    }

    this.isLoading.set(true);
    try {
      await setDoc(
        profileRef,
        {
          settings: {
            categoryBudgets: normalized.categoryBudgets,
            defaultTotalWage: normalized.defaultTotalWage,
            budgetHistory: normalized.budgetHistory,
          },
        },
        { merge: true },
      );

      return normalized;
    } finally {
      this.isLoading.set(false);
    }
  }
}
