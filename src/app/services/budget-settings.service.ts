import { Injectable, effect, inject, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';
import { CATEGORY_BUDGETS, DEFAULT_TOTAL_WAGE } from './expense-state.service';

export interface BudgetSettings {
  categoryBudgets: Record<string, number>;
  defaultTotalWage: number;
}

export function normalizeBudgetSettings(value?: Partial<BudgetSettings> | null): BudgetSettings {
  const categoryBudgets = {
    ...CATEGORY_BUDGETS,
    ...(value?.categoryBudgets ?? {}),
  };

  const defaultTotalWage =
    Number(value?.defaultTotalWage ?? DEFAULT_TOTAL_WAGE) || DEFAULT_TOTAL_WAGE;

  return {
    categoryBudgets: Object.fromEntries(
      Object.entries(categoryBudgets).map(([category, budget]) => [
        category,
        Number(budget ?? CATEGORY_BUDGETS[category] ?? 0) || 0,
      ]),
    ),
    defaultTotalWage,
  };
}

@Injectable({
  providedIn: 'root',
})
export class BudgetSettingsService {
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly settings = signal<BudgetSettings>(normalizeBudgetSettings());

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

  getCategoryBudget(category: string): number | null {
    const value = this.settings().categoryBudgets[category];
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

  async saveSettings(settings: Partial<BudgetSettings>): Promise<BudgetSettings> {
    const profileRef = this.getUserSettingsRef();
    const normalized = normalizeBudgetSettings(settings);
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
